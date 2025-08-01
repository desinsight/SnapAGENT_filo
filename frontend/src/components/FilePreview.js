import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Close as CloseIcon,
  Image as ImageIcon,
  Description as TextIcon,
  PictureAsPdf as PdfIcon,
  Movie as VideoIcon,
  MusicNote as AudioIcon
} from '@mui/icons-material';

function FilePreview({ file, open, onClose }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (open && file) {
      loadPreview();
    }
    return () => {
      setPreview(null);
      setLoading(true);
      setError(null);
    };
  }, [open, file]);

  const loadPreview = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3000/api/preview?path=${encodeURIComponent(file.path)}`);
      if (!response.ok) throw new Error('미리보기를 불러올 수 없습니다.');
      
      const data = await response.json();
      setPreview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    const ext = file?.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon />;
      case 'pdf':
        return <PdfIcon />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <VideoIcon />;
      case 'mp3':
      case 'wav':
        return <AudioIcon />;
      default:
        return <TextIcon />;
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Typography color="error" sx={{ p: 2 }}>
          {error}
        </Typography>
      );
    }

    if (!preview) return null;

    switch (preview.type) {
      case 'image':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <img
              src={preview.data}
              alt={file.name}
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
            />
          </Box>
        );
      case 'text':
        return (
          <Box sx={{ 
            p: 2, 
            bgcolor: 'background.paper',
            borderRadius: 1,
            maxHeight: '70vh',
            overflow: 'auto'
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {preview.data}
            </pre>
          </Box>
        );
      case 'pdf':
        return (
          <iframe
            src={preview.data}
            style={{ width: '100%', height: '70vh', border: 'none' }}
            title={file.name}
          />
        );
      case 'video':
        return (
          <video
            controls
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
            src={preview.data}
          />
        );
      case 'audio':
        return (
          <audio
            controls
            style={{ width: '100%' }}
            src={preview.data}
          />
        );
      default:
        return (
          <Typography sx={{ p: 2 }}>
            이 파일 형식은 미리보기를 지원하지 않습니다.
          </Typography>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getFileIcon()}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {file?.name}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="미리보기" />
          <Tab label="정보" />
        </Tabs>
        
        {activeTab === 0 ? (
          renderPreview()
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2">
              <strong>이름:</strong> {file?.name}
            </Typography>
            <Typography variant="body2">
              <strong>경로:</strong> {file?.path}
            </Typography>
            <Typography variant="body2">
              <strong>크기:</strong> {(file?.size / 1024).toFixed(1)} KB
            </Typography>
            <Typography variant="body2">
              <strong>수정일:</strong> {new Date(file?.modified).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              <strong>생성일:</strong> {new Date(file?.created).toLocaleString()}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FilePreview; 