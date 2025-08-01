import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { logger } from './logger.js';

/**
 * 로컬 캐시 시스템
 * 메모리와 디스크 기반 하이브리드 캐싱
 * @class LocalCache
 */
export class LocalCache {
  constructor(namespace = 'default', options = {}) {
    this.namespace = namespace;
    this.options = {
      maxMemorySize: options.maxMemorySize || 100 * 1024 * 1024, // 100MB
      maxDiskSize: options.maxDiskSize || 1024 * 1024 * 1024, // 1GB
      defaultTTL: options.defaultTTL || 3600, // 1시간
      cleanupInterval: options.cleanupInterval || 300, // 5분
      cacheDir: options.cacheDir || path.join(process.cwd(), '.cache'),
      compression: options.compression !== false, // 기본적으로 압축 사용
      ...options
    };
    
    // 메모리 캐시
    this.memoryCache = new Map();
    this.memorySizes = new Map();
    this.memoryAccessTimes = new Map();
    this.currentMemorySize = 0;
    
    // 디스크 캐시
    this.diskCacheDir = path.join(this.options.cacheDir, this.namespace);
    this.diskIndex = new Map();
    
    // 통계
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      diskHits: 0,
      evictions: 0,
      errors: 0
    };
    
    this.initialize();
  }

  /**
   * 캐시 시스템 초기화
   */
  async initialize() {
    try {
      // 캐시 디렉토리 생성
      await fs.mkdir(this.diskCacheDir, { recursive: true });
      
      // 디스크 캐시 인덱스 로드
      await this.loadDiskIndex();
      
      // 정리 작업 스케줄링
      this.scheduleCleanup();
      
      logger.info(`로컬 캐시 초기화 완료: ${this.namespace}`);
    } catch (error) {
      logger.error('캐시 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 값 저장
   * @param {string} key - 캐시 키
   * @param {any} value - 저장할 값
   * @param {number} ttl - TTL (초)
   * @returns {Promise<boolean>} 성공 여부
   */
  async set(key, value, ttl = this.options.defaultTTL) {
    try {
      const serializedValue = JSON.stringify(value);
      const size = Buffer.byteLength(serializedValue, 'utf8');
      const expiresAt = Date.now() + (ttl * 1000);
      
      const cacheEntry = {
        value: serializedValue,
        size,
        expiresAt,
        accessCount: 0,
        createdAt: Date.now()
      };
      
      // 메모리 캐시에 저장 시도
      if (this.shouldStoreInMemory(size)) {
        await this.setInMemory(key, cacheEntry);
      }
      
      // 디스크 캐시에 저장
      await this.setOnDisk(key, cacheEntry);
      
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('캐시 저장 실패:', { key, error: error.message });
      return false;
    }
  }

  /**
   * 값 조회
   * @param {string} key - 캐시 키
   * @returns {Promise<any>} 캐시된 값 또는 null
   */
  async get(key) {
    try {
      // 메모리 캐시 확인
      const memoryResult = this.getFromMemory(key);
      if (memoryResult !== null) {
        this.stats.hits++;
        this.stats.memoryHits++;
        return memoryResult;
      }
      
      // 디스크 캐시 확인
      const diskResult = await this.getFromDisk(key);
      if (diskResult !== null) {
        this.stats.hits++;
        this.stats.diskHits++;
        
        // 인기 있는 항목은 메모리로 승격
        if (this.shouldPromoteToMemory(key, diskResult)) {
          await this.promoteToMemory(key, diskResult);
        }
        
        return diskResult;
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      logger.error('캐시 조회 실패:', { key, error: error.message });
      return null;
    }
  }

  /**
   * 값 삭제
   * @param {string} key - 캐시 키
   * @returns {Promise<boolean>} 성공 여부
   */
  async delete(key) {
    try {
      let deleted = false;
      
      // 메모리에서 삭제
      if (this.memoryCache.has(key)) {
        const size = this.memorySizes.get(key) || 0;
        this.currentMemorySize -= size;
        
        this.memoryCache.delete(key);
        this.memorySizes.delete(key);
        this.memoryAccessTimes.delete(key);
        deleted = true;
      }
      
      // 디스크에서 삭제
      const diskDeleted = await this.deleteFromDisk(key);
      
      return deleted || diskDeleted;
    } catch (error) {
      this.stats.errors++;
      logger.error('캐시 삭제 실패:', { key, error: error.message });
      return false;
    }
  }

  /**
   * 캐시 정리
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      const now = Date.now();
      
      // 메모리 캐시 정리
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expiresAt <= now) {
          await this.delete(key);
        }
      }
      
      // 디스크 캐시 정리
      await this.cleanupDiskCache();
      
      // LRU 기반 메모리 정리
      await this.evictLRUMemory();
      
      logger.debug(`캐시 정리 완료: ${this.namespace}`);
    } catch (error) {
      logger.error('캐시 정리 실패:', error);
    }
  }

  /**
   * 메모리 캐시 저장
   * @private
   */
  async setInMemory(key, entry) {
    // 메모리 공간 확보
    while (this.currentMemorySize + entry.size > this.options.maxMemorySize) {
      await this.evictLRUMemory();
    }
    
    this.memoryCache.set(key, entry);
    this.memorySizes.set(key, entry.size);
    this.memoryAccessTimes.set(key, Date.now());
    this.currentMemorySize += entry.size;
  }

  /**
   * 메모리 캐시 조회
   * @private
   */
  getFromMemory(key) {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    
    // 만료 확인
    if (entry.expiresAt <= Date.now()) {
      this.delete(key);
      return null;
    }
    
    // 접근 시간 업데이트
    this.memoryAccessTimes.set(key, Date.now());
    entry.accessCount++;
    
    return JSON.parse(entry.value);
  }

  /**
   * 디스크 캐시 저장
   * @private
   */
  async setOnDisk(key, entry) {
    const hashedKey = this.hashKey(key);
    const filePath = path.join(this.diskCacheDir, `${hashedKey}.cache`);
    
    // 압축 적용
    let data = entry.value;
    if (this.options.compression && entry.size > 1024) {
      data = await this.compress(data);
      entry.compressed = true;
    }
    
    const diskEntry = {
      ...entry,
      value: data,
      originalKey: key
    };
    
    await fs.writeFile(filePath, JSON.stringify(diskEntry));
    
    // 인덱스 업데이트
    this.diskIndex.set(key, {
      hashedKey,
      size: entry.size,
      expiresAt: entry.expiresAt,
      filePath
    });
    
    await this.saveDiskIndex();
  }

  /**
   * 디스크 캐시 조회
   * @private
   */
  async getFromDisk(key) {
    const indexEntry = this.diskIndex.get(key);
    if (!indexEntry) return null;
    
    // 만료 확인
    if (indexEntry.expiresAt <= Date.now()) {
      await this.deleteFromDisk(key);
      return null;
    }
    
    try {
      const data = await fs.readFile(indexEntry.filePath, 'utf8');
      const entry = JSON.parse(data);
      
      // 압축 해제
      let value = entry.value;
      if (entry.compressed) {
        value = await this.decompress(value);
      }
      
      entry.accessCount++;
      
      // 파일 업데이트 (접근 횟수)
      await fs.writeFile(indexEntry.filePath, JSON.stringify(entry));
      
      return JSON.parse(value);
    } catch (error) {
      logger.warn(`디스크 캐시 읽기 실패: ${key}`, error.message);
      await this.deleteFromDisk(key);
      return null;
    }
  }

  /**
   * 디스크에서 삭제
   * @private
   */
  async deleteFromDisk(key) {
    const indexEntry = this.diskIndex.get(key);
    if (!indexEntry) return false;
    
    try {
      await fs.unlink(indexEntry.filePath);
      this.diskIndex.delete(key);
      await this.saveDiskIndex();
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.warn(`디스크 캐시 삭제 실패: ${key}`, error.message);
      }
      return false;
    }
  }

  /**
   * LRU 방식으로 메모리 캐시 제거
   * @private
   */
  async evictLRUMemory() {
    if (this.memoryAccessTimes.size === 0) return;
    
    // 가장 오래된 항목 찾기
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, time] of this.memoryAccessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const size = this.memorySizes.get(oldestKey) || 0;
      this.currentMemorySize -= size;
      
      this.memoryCache.delete(oldestKey);
      this.memorySizes.delete(oldestKey);
      this.memoryAccessTimes.delete(oldestKey);
      
      this.stats.evictions++;
    }
  }

  /**
   * 키 해싱
   * @private
   */
  hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * 메모리 저장 여부 결정
   * @private
   */
  shouldStoreInMemory(size) {
    return size <= this.options.maxMemorySize / 10; // 최대 메모리의 10% 이하
  }

  /**
   * 메모리 승격 여부 결정
   * @private
   */
  shouldPromoteToMemory(key, entry) {
    return entry.accessCount > 3 && 
           entry.size <= this.options.maxMemorySize / 20; // 최대 메모리의 5% 이하
  }

  /**
   * 메모리로 승격
   * @private
   */
  async promoteToMemory(key, value) {
    const entry = {
      value: JSON.stringify(value),
      size: Buffer.byteLength(JSON.stringify(value), 'utf8'),
      expiresAt: Date.now() + (this.options.defaultTTL * 1000),
      accessCount: 1,
      createdAt: Date.now()
    };
    
    if (this.shouldStoreInMemory(entry.size)) {
      await this.setInMemory(key, entry);
    }
  }

  /**
   * 디스크 인덱스 로드
   * @private
   */
  async loadDiskIndex() {
    const indexPath = path.join(this.diskCacheDir, 'index.json');
    
    try {
      const data = await fs.readFile(indexPath, 'utf8');
      const index = JSON.parse(data);
      
      this.diskIndex = new Map(Object.entries(index));
      
      // 만료된 항목 정리
      const now = Date.now();
      for (const [key, entry] of this.diskIndex.entries()) {
        if (entry.expiresAt <= now) {
          await this.deleteFromDisk(key);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.warn('디스크 인덱스 로드 실패:', error.message);
      }
    }
  }

  /**
   * 디스크 인덱스 저장
   * @private
   */
  async saveDiskIndex() {
    const indexPath = path.join(this.diskCacheDir, 'index.json');
    const index = Object.fromEntries(this.diskIndex.entries());
    
    try {
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      logger.error('디스크 인덱스 저장 실패:', error);
    }
  }

  /**
   * 디스크 캐시 정리
   * @private
   */
  async cleanupDiskCache() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, entry] of this.diskIndex.entries()) {
      if (entry.expiresAt <= now) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      await this.deleteFromDisk(key);
    }
  }

  /**
   * 정리 작업 스케줄링
   * @private
   */
  scheduleCleanup() {
    setInterval(() => {
      this.cleanup().catch(error => {
        logger.error('스케줄된 캐시 정리 실패:', error);
      });
    }, this.options.cleanupInterval * 1000);
  }

  /**
   * 압축
   * @private
   */
  async compress(data) {
    // 간단한 구현 - 실제로는 zlib 등을 사용
    return Buffer.from(data).toString('base64');
  }

  /**
   * 압축 해제
   * @private
   */
  async decompress(data) {
    return Buffer.from(data, 'base64').toString('utf8');
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      memorySize: this.currentMemorySize,
      memoryItems: this.memoryCache.size,
      diskItems: this.diskIndex.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  /**
   * 캐시 클리어
   */
  async clear() {
    // 메모리 캐시 클리어
    this.memoryCache.clear();
    this.memorySizes.clear();
    this.memoryAccessTimes.clear();
    this.currentMemorySize = 0;
    
    // 디스크 캐시 클리어
    try {
      await fs.rm(this.diskCacheDir, { recursive: true, force: true });
      await fs.mkdir(this.diskCacheDir, { recursive: true });
      this.diskIndex.clear();
    } catch (error) {
      logger.error('디스크 캐시 클리어 실패:', error);
    }
    
    // 통계 리셋
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      diskHits: 0,
      evictions: 0,
      errors: 0
    };
  }
}

export default LocalCache;