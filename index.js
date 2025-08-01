#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import os from "os";
import winston from "winston";
import dotenv from "dotenv";
import JSZip from "jszip";

// 환경 변수 로드
dotenv.config();

// 기본 설정
const config = {
  maxFileSize: process.env.MAX_FILE_SIZE || 1024 * 1024, // 기본값 1MB
  maxSearchResults: process.env.MAX_SEARCH_RESULTS || 50,
  maxSearchDepth: process.env.MAX_SEARCH_DEPTH || 10,
  logLevel: process.env.LOG_LEVEL || 'info'
};

// 로거 설정
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
    stderrLevels: ['info', 'warn', 'error', 'debug']
  }));
}

// 드라이브 목록 조회 함수
function getDrives() {
  logger.info('드라이브 목록 조회 시작');
  if (os.platform() === "win32") {
    const drives = [];
    for (let i = 65; i <= 90; i++) { // A-Z
      const drive = String.fromCharCode(i) + ":\\";
      try {
        fs.accessSync(drive, fs.constants.F_OK);
        drives.push(drive);
        logger.debug(`드라이브 발견: ${drive}`);
      } catch (e) {
        // 드라이브가 존재하지 않음
      }
    }
    logger.info(`총 ${drives.length}개의 드라이브 발견`);
    return drives;
  } else {
    logger.info('Unix 시스템: 루트 디렉토리 반환');
    return ["/"];
  }
}

// 파일/폴더 목록 조회 함수
function listFiles(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`경로가 존재하지 않습니다: ${dirPath}`);
    }

    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) {
      throw new Error(`디렉토리가 아닙니다: ${dirPath}`);
    }

    const items = fs.readdirSync(dirPath).map(name => {
      const fullPath = path.join(dirPath, name);
      try {
        const itemStat = fs.statSync(fullPath);
        return {
          name,
          path: fullPath,
          isDirectory: itemStat.isDirectory(),
          size: itemStat.size,
          modified: itemStat.mtime.toISOString()
        };
      } catch (e) {
        return {
          name,
          path: fullPath,
          isDirectory: false,
          size: 0,
          modified: new Date().toISOString(),
          error: "접근 불가"
        };
      }
    });

    return items;
  } catch (error) {
    throw new Error(`폴더 목록 조회 실패: ${error.message}`);
  }
}

// 파일 읽기 함수
function readFileContent(filePath, maxSize = 1024 * 1024) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`파일이 존재하지 않습니다: ${filePath}`);
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      throw new Error(`디렉토리는 읽을 수 없습니다: ${filePath}`);
    }

    if (stat.size > maxSize) {
      throw new Error(`파일이 너무 큽니다 (${stat.size} bytes > ${maxSize} bytes)`);
    }

    const content = fs.readFileSync(filePath, "utf8");
    return {
      content,
      size: stat.size,
      modified: stat.mtime.toISOString()
    };
  } catch (error) {
    throw new Error(`파일 읽기 실패: ${error.message}`);
  }
}

// 파일 검색 함수
function searchFiles(basePath, keyword, maxResults = 50) {
  const results = [];
  
  function searchInDirectory(dirPath, depth = 0) {
    if (results.length >= maxResults || depth > 10) return;
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        if (results.length >= maxResults) break;
        
        const fullPath = path.join(dirPath, item);
        
        if (item.toLowerCase().includes(keyword.toLowerCase())) {
          try {
            const stat = fs.statSync(fullPath);
            results.push({
              path: fullPath,
              name: item,
              isDirectory: stat.isDirectory(),
              size: stat.size,
              modified: stat.mtime.toISOString()
            });
          } catch (e) {
            // 파일 접근 실패 시 무시
          }
        }
        
        // 하위 디렉토리도 검색
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory() && !item.startsWith('.')) {
            searchInDirectory(fullPath, depth + 1);
          }
        } catch (e) {
          // 디렉토리 접근 실패 시 무시
        }
      }
    } catch (error) {
      // 디렉토리 읽기 실패 시 무시
    }
  }
  
  searchInDirectory(basePath);
  return results;
}

// 헬퍼 함수들
async function fileExists(path) {
  try {
    await fs.promises.access(path);
    return true;
  } catch {
    return false;
  }
}

async function getFilePermissions(path) {
  try {
    const stats = await fs.promises.stat(path);
    return {
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid,
      readable: !!(stats.mode & fs.constants.R_OK),
      writable: !!(stats.mode & fs.constants.W_OK),
      executable: !!(stats.mode & fs.constants.X_OK)
    };
  } catch (error) {
    logger.error(`파일 권한 조회 실패: ${error.message}`, { path });
    throw new Error(`파일 권한 조회 실패: ${error.message}`);
  }
}

async function getFileOwner(path) {
  try {
    const stats = await fs.promises.stat(path);
    return {
      uid: stats.uid,
      gid: stats.gid
    };
  } catch (error) {
    logger.error(`파일 소유자 조회 실패: ${error.message}`, { path });
    throw new Error(`파일 소유자 조회 실패: ${error.message}`);
  }
}

async function searchInFiles(pattern, basePath, filePattern = '*.*', caseSensitive = false) {
  const results = [];
  const regex = new RegExp(pattern, caseSensitive ? '' : 'i');
  const glob = new RegExp(filePattern.replace(/\./g, '\\.').replace(/\*/g, '.*'));
  
  async function searchInDirectory(dirPath, depth = 0) {
    if (depth > config.maxSearchDepth) return;
    
    try {
      const items = await fs.promises.readdir(dirPath);
      
      for (const item of items) {
        if (results.length >= config.maxSearchResults) break;
        
        const fullPath = path.join(dirPath, item);
        
        try {
          const stat = await fs.promises.stat(fullPath);
          
          if (stat.isDirectory()) {
            await searchInDirectory(fullPath, depth + 1);
          } else if (stat.isFile() && glob.test(item)) {
            const content = await fs.promises.readFile(fullPath, 'utf-8');
            const matches = content.match(regex);
            
            if (matches) {
              results.push({
                path: fullPath,
                matches: matches.length,
                size: stat.size,
                modified: stat.mtime
              });
            }
          }
        } catch (e) {
          logger.warn(`파일 접근 실패: ${fullPath}`, { error: e.message });
        }
      }
    } catch (error) {
      logger.error(`디렉토리 검색 실패: ${error.message}`, { path: dirPath });
    }
  }
  
  await searchInDirectory(basePath);
  return results;
}

// 고급 검색 함수
async function advancedSearch(params) {
  const {
    path,
    pattern,
    dateFrom,
    dateTo,
    sizeFrom,
    sizeTo,
    extensions,
    regex,
    caseSensitive,
    sortBy,
    sortOrder,
    includeMetadata
  } = params;

  const results = [];
  const searchHistory = [];
  
  // 정규식 컴파일
  const regexPattern = regex ? new RegExp(pattern, caseSensitive ? '' : 'i') : null;
  
  // 날짜 변환
  const fromDate = dateFrom ? new Date(dateFrom) : null;
  const toDate = dateTo ? new Date(dateTo) : null;
  
  // 크기 변환 (바이트)
  const minSize = sizeFrom ? parseInt(sizeFrom) : 0;
  const maxSize = sizeTo ? parseInt(sizeTo) : Infinity;
  
  // 확장자 필터
  const extFilter = extensions ? new Set(extensions.map(ext => ext.toLowerCase())) : null;

  async function searchInDirectory(dirPath, depth = 0) {
    if (depth > config.maxSearchDepth) return;
    
    try {
      const items = await fs.promises.readdir(dirPath);
      
      for (const item of items) {
        if (results.length >= config.maxSearchResults) break;
        
        const fullPath = path.join(dirPath, item);
        
        try {
          const stat = await fs.promises.stat(fullPath);
          
          // 기본 필터링
          if (stat.isDirectory()) {
            await searchInDirectory(fullPath, depth + 1);
            continue;
          }

          // 확장자 필터링
          const ext = path.extname(item).toLowerCase().slice(1);
          if (extFilter && !extFilter.has(ext)) continue;

          // 크기 필터링
          if (stat.size < minSize || stat.size > maxSize) continue;

          // 날짜 필터링
          if (fromDate && stat.mtime < fromDate) continue;
          if (toDate && stat.mtime > toDate) continue;

          // 이름/패턴 매칭
          const matches = regexPattern 
            ? regexPattern.test(item)
            : item.toLowerCase().includes(pattern.toLowerCase());

          if (!matches) continue;

          // 메타데이터 수집
          let metadata = null;
          if (includeMetadata) {
            if (config.search.supportedImageFormats.includes(ext)) {
              metadata = await getImageMetadata(fullPath);
            } else if (config.search.supportedMediaFormats.includes(ext)) {
              metadata = await getMediaMetadata(fullPath);
            }
          }

          results.push({
            path: fullPath,
            name: item,
            size: stat.size,
            modified: stat.mtime,
            created: stat.birthtime,
            extension: ext,
            metadata
          });

          // 검색 히스토리 추가
          searchHistory.push({
            pattern,
            path: fullPath,
            timestamp: new Date()
          });

        } catch (e) {
          logger.warn(`파일 접근 실패: ${fullPath}`, { error: e.message });
        }
      }
    } catch (error) {
      logger.error(`디렉토리 검색 실패: ${error.message}`, { path: dirPath });
    }
  }

  await searchInDirectory(path);

  // 결과 정렬
  results.sort((a, b) => {
    const order = sortOrder === 'desc' ? -1 : 1;
    switch (sortBy) {
      case 'name':
        return order * a.name.localeCompare(b.name);
      case 'size':
        return order * (a.size - b.size);
      case 'modified':
        return order * (a.modified - b.modified);
      case 'created':
        return order * (a.created - b.created);
      default:
        return 0;
    }
  });

  return {
    results,
    total: results.length,
    searchHistory: searchHistory.slice(-config.search.historySize)
  };
}

// 이미지 메타데이터 추출
async function getImageMetadata(filePath) {
  try {
    const { default: sharp } = await import('sharp');
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      hasAlpha: metadata.hasAlpha,
      colorSpace: metadata.space
    };
  } catch (error) {
    logger.warn(`이미지 메타데이터 추출 실패: ${filePath}`, { error: error.message });
    return null;
  }
}

// 미디어 파일 메타데이터 추출
async function getMediaMetadata(filePath) {
  try {
    const { default: ffmpeg } = await import('fluent-ffmpeg');
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({
          format: metadata.format,
          streams: metadata.streams.map(stream => ({
            type: stream.codec_type,
            codec: stream.codec_name,
            duration: stream.duration,
            bitrate: stream.bit_rate
          }))
        });
      });
    });
  } catch (error) {
    logger.warn(`미디어 메타데이터 추출 실패: ${filePath}`, { error: error.message });
    return null;
  }
}

// 도구 정의
const tools = [
  // 기존 도구들
  {
    name: 'list_drives',
    description: '사용 가능한 드라이브 목록을 반환합니다',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'list_files',
    description: '지정된 경로의 파일 목록을 반환합니다',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '디렉토리 경로'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'read_file',
    description: '파일 내용을 읽습니다',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '파일 경로'
        },
        start: {
          type: 'number',
          description: '시작 위치 (바이트)',
          default: 0
        },
        length: {
          type: 'number',
          description: '읽을 길이 (바이트)',
          default: config.maxFileSize
        }
      },
      required: ['path']
    }
  },
  {
    name: 'search_files',
    description: '파일명으로 파일을 검색합니다',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: '검색할 파일명 패턴'
        },
        startPath: {
          type: 'string',
          description: '검색 시작 경로',
          default: process.cwd()
        }
      },
      required: ['pattern']
    }
  },
  // 새로운 도구들
  {
    name: 'write_file',
    description: '파일을 생성하거나 수정합니다',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '파일 경로'
        },
        content: {
          type: 'string',
          description: '쓸 내용'
        },
        append: {
          type: 'boolean',
          description: '파일 끝에 추가할지 여부',
          default: false
        },
        overwrite: {
          type: 'boolean',
          description: '기존 파일 덮어쓰기 여부',
          default: false
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'delete_file',
    description: '파일을 삭제합니다',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '삭제할 파일 경로'
        },
        force: {
          type: 'boolean',
          description: '강제 삭제 여부',
          default: false
        }
      },
      required: ['path']
    }
  },
  {
    name: 'create_directory',
    description: '새 디렉토리를 생성합니다',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '생성할 디렉토리 경로'
        },
        recursive: {
          type: 'boolean',
          description: '상위 디렉토리도 함께 생성',
          default: false
        }
      },
      required: ['path']
    }
  },
  {
    name: 'delete_directory',
    description: '비어있는 디렉토리를 삭제합니다',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '삭제할 디렉토리 경로'
        },
        recursive: {
          type: 'boolean',
          description: '내용물이 있어도 삭제',
          default: false
        }
      },
      required: ['path']
    }
  },
  {
    name: 'copy_file',
    description: '파일을 복사합니다',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: '원본 파일 경로'
        },
        destination: {
          type: 'string',
          description: '대상 파일 경로'
        },
        overwrite: {
          type: 'boolean',
          description: '기존 파일 덮어쓰기 여부',
          default: false
        }
      },
      required: ['source', 'destination']
    }
  },
  {
    name: 'move_file',
    description: '파일이나 디렉토리를 이동합니다',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: '원본 경로'
        },
        destination: {
          type: 'string',
          description: '대상 경로'
        },
        overwrite: {
          type: 'boolean',
          description: '기존 파일 덮어쓰기 여부',
          default: false
        }
      },
      required: ['source', 'destination']
    }
  },
  {
    name: 'get_file_info',
    description: '파일의 상세 정보를 반환합니다',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '파일 경로'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'search_in_files',
    description: '파일 내용에서 텍스트를 검색합니다',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: '검색할 텍스트'
        },
        path: {
          type: 'string',
          description: '검색할 디렉토리 경로'
        },
        filePattern: {
          type: 'string',
          description: '검색할 파일 패턴',
          default: '*.*'
        },
        caseSensitive: {
          type: 'boolean',
          description: '대소문자 구분 여부',
          default: false
        }
      },
      required: ['pattern', 'path']
    }
  },
  {
    name: 'backup_file',
    description: '파일을 백업합니다',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '백업할 파일 경로'
        },
        backupPath: {
          type: 'string',
          description: '백업 파일 경로 (지정하지 않으면 .bak 확장자 사용)'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'compress_files',
    description: '여러 파일을 ZIP으로 압축합니다',
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: '압축할 파일 경로 목록'
        },
        outputPath: {
          type: 'string',
          description: '출력 ZIP 파일 경로'
        },
        basePath: {
          type: 'string',
          description: '압축 파일의 기본 경로',
          default: ''
        }
      },
      required: ['files', 'outputPath']
    }
  },
  {
    name: 'advanced_search',
    description: '고급 파일 검색을 수행합니다',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '검색 시작 경로'
        },
        pattern: {
          type: 'string',
          description: '검색할 패턴'
        },
        dateFrom: {
          type: 'string',
          description: '시작 날짜 (YYYY-MM-DD)'
        },
        dateTo: {
          type: 'string',
          description: '종료 날짜 (YYYY-MM-DD)'
        },
        sizeFrom: {
          type: 'string',
          description: '최소 파일 크기 (바이트)'
        },
        sizeTo: {
          type: 'string',
          description: '최대 파일 크기 (바이트)'
        },
        extensions: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: '검색할 파일 확장자 목록'
        },
        regex: {
          type: 'boolean',
          description: '정규식 사용 여부',
          default: false
        },
        caseSensitive: {
          type: 'boolean',
          description: '대소문자 구분 여부',
          default: false
        },
        sortBy: {
          type: 'string',
          description: '정렬 기준 (name, size, modified, created)',
          default: 'name'
        },
        sortOrder: {
          type: 'string',
          description: '정렬 순서 (asc, desc)',
          default: 'asc'
        },
        includeMetadata: {
          type: 'boolean',
          description: '메타데이터 포함 여부',
          default: false
        }
      },
      required: ['path', 'pattern']
    }
  }
];

// 도구 구현
const toolImplementations = {
  list_drives: async () => {
    const drives = getDrives();
    return {
      content: [
        {
          type: "text",
          text: `사용 가능한 드라이브:\n${drives.map(d => `- ${d}`).join('\n')}`,
        },
      ],
    };
  },

  list_files: async ({ path: dirPath }) => {
    const files = listFiles(dirPath);
    const summary = `경로: ${dirPath}\n총 ${files.length}개 항목\n\n`;
    const fileList = files.map(f => 
      `${f.isDirectory ? '📁' : '📄'} ${f.name} ${f.isDirectory ? '' : `(${f.size} bytes)`}`
    ).join('\n');
    
    return {
      content: [
        {
          type: "text",
          text: summary + fileList,
        },
      ],
    };
  },

  read_file: async ({ path: filePath, start = 0, length = config.maxFileSize }) => {
    const result = readFileContent(filePath);
    
    return {
      content: [
        {
          type: "text",
          text: `파일: ${filePath}\n크기: ${result.size} bytes\n수정일: ${result.modified}\n\n내용:\n${result.content.slice(start, start + length)}`,
        },
      ],
    };
  },

  search_files: async ({ pattern, startPath }) => {
    const results = searchFiles(startPath, pattern);
    
    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `검색 결과 없음\n경로: ${startPath}\n키워드: ${pattern}`,
          },
        ],
      };
    }

    const summary = `검색 결과: ${results.length}개 항목 (키워드: "${pattern}")\n\n`;
    const resultList = results.map(r => 
      `${r.isDirectory ? '📁' : '📄'} ${r.path} ${r.isDirectory ? '' : `(${r.size} bytes)`}`
    ).join('\n');

    return {
      content: [
        {
          type: "text",
          text: summary + resultList,
        },
      ],
    };
  },

  write_file: async ({ path: filePath, content, append = false, overwrite = false }) => {
    logger.info(`파일 쓰기 요청: ${filePath}`, { append, overwrite });
    try {
      if (!overwrite && !append && await fileExists(filePath)) {
        throw new Error(`파일이 이미 존재합니다: ${filePath}`);
      }

      const options = {
        encoding: 'utf-8',
        flag: append ? 'a' : 'w'
      };
      
      await fs.promises.writeFile(filePath, content, options);
      const stats = await fs.promises.stat(filePath);
      
      logger.info(`파일 쓰기 완료: ${filePath}`, { size: stats.size });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              path: filePath,
              size: stats.size,
              modified: stats.mtime
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`파일 쓰기 실패: ${error.message}`, { path: filePath });
      throw new Error(`파일 쓰기 실패: ${error.message}`);
    }
  },

  delete_file: async ({ path: filePath, force = false }) => {
    logger.info(`파일 삭제 요청: ${filePath}`, { force });
    try {
      const stats = await fs.promises.stat(filePath);
      if (!force && stats.isDirectory()) {
        throw new Error(`디렉토리는 삭제할 수 없습니다: ${filePath}`);
      }
      
      await fs.promises.unlink(filePath);
      logger.info(`파일 삭제 완료: ${filePath}`);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              path: filePath,
              size: stats.size,
              deleted: new Date()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`파일 삭제 실패: ${error.message}`, { path: filePath });
      throw new Error(`파일 삭제 실패: ${error.message}`);
    }
  },

  create_directory: async ({ path: dirPath, recursive = false }) => {
    logger.info(`디렉토리 생성 요청: ${dirPath}`, { recursive });
    try {
      await fs.promises.mkdir(dirPath, { recursive });
      const stats = await fs.promises.stat(dirPath);
      
      logger.info(`디렉토리 생성 완료: ${dirPath}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              path: dirPath,
              created: stats.birthtime,
              isDirectory: true
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`디렉토리 생성 실패: ${error.message}`, { path: dirPath });
      throw new Error(`디렉토리 생성 실패: ${error.message}`);
    }
  },

  delete_directory: async ({ path: dirPath, recursive = false }) => {
    logger.info(`디렉토리 삭제 요청: ${dirPath}`, { recursive });
    try {
      const stats = await fs.promises.stat(dirPath);
      if (!stats.isDirectory()) {
        throw new Error(`파일은 삭제할 수 없습니다: ${dirPath}`);
      }

      if (!recursive) {
        const files = await fs.promises.readdir(dirPath);
        if (files.length > 0) {
          throw new Error(`디렉토리가 비어있지 않습니다: ${dirPath}`);
        }
      }
      
      await fs.promises.rm(dirPath, { recursive });
      logger.info(`디렉토리 삭제 완료: ${dirPath}`);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              path: dirPath,
              deleted: new Date()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`디렉토리 삭제 실패: ${error.message}`, { path: dirPath });
      throw new Error(`디렉토리 삭제 실패: ${error.message}`);
    }
  },

  copy_file: async ({ source, destination, overwrite = false }) => {
    logger.info(`파일 복사 요청: ${source} -> ${destination}`, { overwrite });
    try {
      if (!overwrite && await fileExists(destination)) {
        throw new Error(`대상 파일이 이미 존재합니다: ${destination}`);
      }

      await fs.promises.copyFile(source, destination);
      const stats = await fs.promises.stat(destination);
      
      logger.info(`파일 복사 완료: ${destination}`, { size: stats.size });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              source,
              destination,
              size: stats.size,
              copied: new Date()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`파일 복사 실패: ${error.message}`, { source, destination });
      throw new Error(`파일 복사 실패: ${error.message}`);
    }
  },

  move_file: async ({ source, destination, overwrite = false }) => {
    logger.info(`파일 이동 요청: ${source} -> ${destination}`, { overwrite });
    try {
      if (!overwrite && await fileExists(destination)) {
        throw new Error(`대상 파일이 이미 존재합니다: ${destination}`);
      }

      await fs.promises.rename(source, destination);
      const stats = await fs.promises.stat(destination);
      
      logger.info(`파일 이동 완료: ${destination}`, { size: stats.size });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              source,
              destination,
              size: stats.size,
              moved: new Date()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`파일 이동 실패: ${error.message}`, { source, destination });
      throw new Error(`파일 이동 실패: ${error.message}`);
    }
  },

  get_file_info: async ({ path: filePath }) => {
    logger.info(`파일 정보 조회 요청: ${filePath}`);
    try {
      const stats = await fs.promises.stat(filePath);
      const permissions = await getFilePermissions(filePath);
      
      logger.info(`파일 정보 조회 완료: ${filePath}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              path: filePath,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              accessed: stats.atime,
              isDirectory: stats.isDirectory(),
              isFile: stats.isFile(),
              permissions,
              owner: await getFileOwner(filePath)
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`파일 정보 조회 실패: ${error.message}`, { path: filePath });
      throw new Error(`파일 정보 조회 실패: ${error.message}`);
    }
  },

  search_in_files: async ({ pattern, path, filePattern = '*.*', caseSensitive = false }) => {
    logger.info(`파일 내용 검색 요청: ${pattern}`, { path, filePattern, caseSensitive });
    try {
      const results = await searchInFiles(pattern, path, filePattern, caseSensitive);
      
      logger.info(`파일 내용 검색 완료: ${results.length}개 결과`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              pattern,
              path,
              results
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`파일 내용 검색 실패: ${error.message}`, { pattern, path });
      throw new Error(`파일 내용 검색 실패: ${error.message}`);
    }
  },

  backup_file: async ({ path: filePath, backupPath }) => {
    logger.info(`파일 백업 요청: ${filePath}`);
    try {
      if (!backupPath) {
        backupPath = `${filePath}.bak`;
      }

      if (await fileExists(backupPath)) {
        throw new Error(`백업 파일이 이미 존재합니다: ${backupPath}`);
      }

      await fs.promises.copyFile(filePath, backupPath);
      const stats = await fs.promises.stat(backupPath);
      
      logger.info(`파일 백업 완료: ${backupPath}`, { size: stats.size });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              original: filePath,
              backup: backupPath,
              size: stats.size,
              backedUp: new Date()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`파일 백업 실패: ${error.message}`, { path: filePath });
      throw new Error(`파일 백업 실패: ${error.message}`);
    }
  },

  compress_files: async ({ files, outputPath, basePath = '' }) => {
    logger.info(`파일 압축 요청: ${outputPath}`, { files, basePath });
    try {
      const zip = new JSZip();
      
      for (const file of files) {
        const content = await fs.promises.readFile(file);
        const relativePath = path.relative(basePath, file);
        zip.file(relativePath, content);
      }
      
      const content = await zip.generateAsync({ type: 'nodebuffer' });
      await fs.promises.writeFile(outputPath, content);
      
      const stats = await fs.promises.stat(outputPath);
      logger.info(`파일 압축 완료: ${outputPath}`, { size: stats.size });
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              files,
              outputPath,
              size: stats.size,
              compressed: new Date()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`파일 압축 실패: ${error.message}`, { outputPath });
      throw new Error(`파일 압축 실패: ${error.message}`);
    }
  },

  advanced_search: async (params) => {
    logger.info('고급 검색 요청', params);
    try {
      const result = await advancedSearch(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              total: result.total,
              results: result.results,
              searchHistory: result.searchHistory
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`고급 검색 실패: ${error.message}`, params);
      throw new Error(`고급 검색 실패: ${error.message}`);
    }
  }
};

// MCP 서버 생성
const server = new Server(
  {
    name: "filesystem-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Initialize 핸들러 (필수!)
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  return {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {}
    },
    serverInfo: {
      name: "filesystem-server",
      version: "1.0.0",
    },
  };
});

// 서버 시작 시 로깅
logger.info('MCP 파일시스템 서버 시작됨');

// 도구 목록 핸들러
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('도구 목록 요청 수신');
  return {
    tools: tools
  };
});

// 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  logger.debug(`도구 실행 요청 수신: ${name}`, { args });

  try {
    const tool = toolImplementations[name];
    if (!tool) {
      throw new Error(`알 수 없는 도구: ${name}`);
    }
    return await tool(args);
  } catch (error) {
    logger.error(`도구 실행 실패: ${error.message}`, { name, args });
    throw error;
  }
});

// 서버 시작
async function main() {
  try {
    logger.info('MCP 파일시스템 서버가 HTTP 모드로 시작되었습니다');
    
    // HTTP 모드에서는 무한 대기
    await new Promise(() => {});
  } catch (error) {
    logger.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('서버 실행 중 오류 발생:', error);
  process.exit(1);
});