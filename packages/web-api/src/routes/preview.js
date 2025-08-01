import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import filePreviewService from '../services/filePreviewService.js';

const router = express.Router();

// 파일 미리보기 및 분석
router.get('/file/:filePath(*)', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    
    // 파일 존재 확인
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    const preview = await filePreviewService.getFilePreview(filePath);
    res.json(preview);
  } catch (error) {
    console.error('파일 미리보기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 텍스트 파일 내용 읽기
router.get('/text/:filePath(*)', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const { start = 0, end = 1000 } = req.query;
    
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const requestedLines = lines.slice(parseInt(start), parseInt(end));
    
    res.json({
      content: requestedLines.join('\n'),
      totalLines: lines.length,
      start: parseInt(start),
      end: parseInt(end),
      hasMore: parseInt(end) < lines.length
    });
  } catch (error) {
    console.error('텍스트 파일 읽기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 이미지 파일 정보
router.get('/image/:filePath(*)', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const stats = await fs.stat(filePath);
    
    res.json({
      fileName: path.basename(filePath),
      filePath: filePath,
      size: stats.size,
      format: path.extname(filePath).substring(1).toUpperCase(),
      modifiedDate: stats.mtime,
      // 실제 이미지 분석을 위해서는 sharp 라이브러리 필요
      dimensions: '이미지 분석 필요',
      previewUrl: `/api/preview/image/${encodeURIComponent(filePath)}`
    });
  } catch (error) {
    console.error('이미지 파일 정보 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 문서 파일 정보
router.get('/document/:filePath(*)', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const stats = await fs.stat(filePath);
    
    res.json({
      fileName: path.basename(filePath),
      filePath: filePath,
      size: stats.size,
      format: path.extname(filePath).substring(1).toUpperCase(),
      modifiedDate: stats.mtime,
      // 실제 문서 분석을 위해서는 pdf-lib 등 필요
      pages: '문서 분석 필요',
      previewUrl: `/api/preview/document/${encodeURIComponent(filePath)}`
    });
  } catch (error) {
    console.error('문서 파일 정보 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 오디오 파일 정보
router.get('/audio/:filePath(*)', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const stats = await fs.stat(filePath);
    
    res.json({
      fileName: path.basename(filePath),
      filePath: filePath,
      size: stats.size,
      format: path.extname(filePath).substring(1).toUpperCase(),
      modifiedDate: stats.mtime,
      // 실제 오디오 분석을 위해서는 ffmpeg 등 필요
      duration: '오디오 분석 필요',
      previewUrl: `/api/preview/audio/${encodeURIComponent(filePath)}`
    });
  } catch (error) {
    console.error('오디오 파일 정보 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 비디오 파일 정보
router.get('/video/:filePath(*)', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const stats = await fs.stat(filePath);
    
    res.json({
      fileName: path.basename(filePath),
      filePath: filePath,
      size: stats.size,
      format: path.extname(filePath).substring(1).toUpperCase(),
      modifiedDate: stats.mtime,
      // 실제 비디오 분석을 위해서는 ffmpeg 등 필요
      duration: '비디오 분석 필요',
      resolution: '비디오 분석 필요',
      previewUrl: `/api/preview/video/${encodeURIComponent(filePath)}`
    });
  } catch (error) {
    console.error('비디오 파일 정보 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 바이너리 파일 정보
router.get('/binary/:filePath(*)', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const stats = await fs.stat(filePath);
    const buffer = await fs.readFile(filePath);
    const hexPreview = buffer.slice(0, 256).toString('hex');
    
    res.json({
      fileName: path.basename(filePath),
      filePath: filePath,
      size: stats.size,
      modifiedDate: stats.mtime,
      hexPreview: hexPreview,
      isExecutable: filePreviewService.isExecutable(filePath),
      fileSignature: filePreviewService.getFileSignature(buffer)
    });
  } catch (error) {
    console.error('바이너리 파일 정보 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 파일 메타데이터만 추출
router.get('/metadata/:filePath(*)', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const stats = await fs.stat(filePath);
    const metadata = await filePreviewService.extractMetadata(filePath, stats);
    
    res.json(metadata);
  } catch (error) {
    console.error('메타데이터 추출 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI 분석만 수행
router.post('/analyze/:filePath(*)', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const { analysisType = 'auto' } = req.body;
    
    const ext = path.extname(filePath).toLowerCase();
    let aiSummary = '';
    
    switch (analysisType) {
      case 'text':
        const textPreview = await filePreviewService.getTextPreview(filePath);
        aiSummary = await filePreviewService.getTextAISummary(filePath, textPreview);
        break;
      case 'image':
        aiSummary = await filePreviewService.getImageAISummary(filePath);
        break;
      case 'document':
        aiSummary = await filePreviewService.getDocumentAISummary(filePath);
        break;
      case 'audio':
        aiSummary = await filePreviewService.getAudioAISummary(filePath);
        break;
      case 'video':
        aiSummary = await filePreviewService.getVideoAISummary(filePath);
        break;
      case 'binary':
        aiSummary = await filePreviewService.getBinaryAISummary(filePath);
        break;
      default:
        // 자동 감지
        if (filePreviewService.supportedTextExtensions.includes(ext)) {
          const textPreview = await filePreviewService.getTextPreview(filePath);
          aiSummary = await filePreviewService.getTextAISummary(filePath, textPreview);
        } else if (filePreviewService.supportedImageExtensions.includes(ext)) {
          aiSummary = await filePreviewService.getImageAISummary(filePath);
        } else if (filePreviewService.supportedDocumentExtensions.includes(ext)) {
          aiSummary = await filePreviewService.getDocumentAISummary(filePath);
        } else if (filePreviewService.supportedAudioExtensions.includes(ext)) {
          aiSummary = await filePreviewService.getAudioAISummary(filePath);
        } else if (filePreviewService.supportedVideoExtensions.includes(ext)) {
          aiSummary = await filePreviewService.getVideoAISummary(filePath);
        } else {
          aiSummary = await filePreviewService.getBinaryAISummary(filePath);
        }
    }
    
    res.json({ aiSummary });
  } catch (error) {
    console.error('AI 분석 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 파일 타입별 미리보기 (일괄 처리)
router.post('/batch', async (req, res) => {
  try {
    const { filePaths } = req.body;
    
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return res.status(400).json({ error: '파일 경로 배열이 필요합니다.' });
    }
    
    const previews = await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          return await filePreviewService.getFilePreview(filePath);
        } catch (error) {
          return {
            filePath,
            error: error.message
          };
        }
      })
    );
    
    res.json({ previews });
  } catch (error) {
    console.error('일괄 미리보기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 파일 비교 분석
router.post('/compare', async (req, res) => {
  try {
    const { filePath1, filePath2 } = req.body;
    
    if (!filePath1 || !filePath2) {
      return res.status(400).json({ error: '두 개의 파일 경로가 필요합니다.' });
    }
    
    const preview1 = await filePreviewService.getFilePreview(filePath1);
    const preview2 = await filePreviewService.getFilePreview(filePath2);
    
    // 파일 유사도 계산
    const similarity = await filePreviewService.calculateFileSimilarity(filePath1, filePath2);
    
    res.json({
      file1: preview1,
      file2: preview2,
      similarity,
      comparison: {
        sizeDifference: Math.abs(preview1.size - preview2.size),
        typeMatch: preview1.type === preview2.type,
        extensionMatch: preview1.extension === preview2.extension,
        dateDifference: Math.abs(preview1.modifiedDate - preview2.modifiedDate)
      }
    });
  } catch (error) {
    console.error('파일 비교 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 지원하는 파일 타입 목록
router.get('/supported-types', (req, res) => {
  res.json({
    text: filePreviewService.supportedTextExtensions,
    image: filePreviewService.supportedImageExtensions,
    document: filePreviewService.supportedDocumentExtensions,
    audio: filePreviewService.supportedAudioExtensions,
    video: filePreviewService.supportedVideoExtensions
  });
});

export default router; 