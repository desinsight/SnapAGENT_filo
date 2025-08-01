import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  ContentCut as CutIcon
} from '@mui/icons-material';

function FileOrganizer({ open, onClose, files, onOrganize }) {
  const [criteria, setCriteria] = useState('type');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [action, setAction] = useState('move'); // 'move' or 'copy'

  const handleOrganize = async () => {
    if (selectedFiles.length === 0) {
      setError('정리할 파일을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onOrganize({
        files: selectedFiles,
        criteria,
        action
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFiles(prev => {
      const exists = prev.find(f => f.path === file.path);
      if (exists) {
        return prev.filter(f => f.path !== file.path);
      }
      return [...prev, file];
    });
  };

  const getFileIcon = (file) => {
    return file.isDirectory ? <FolderIcon /> : <FileIcon />;
  };

  const getFileType = (file) => {
    if (file.isDirectory) return '폴더';
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '이미지';
      case 'pdf':
        return 'PDF';
      case 'doc':
      case 'docx':
        return '문서';
      case 'xls':
      case 'xlsx':
        return '스프레드시트';
      case 'mp4':
      case 'avi':
      case 'mov':
        return '비디오';
      case 'mp3':
      case 'wav':
        return '오디오';
      default:
        return '기타';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>파일 정리</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>정리 기준</InputLabel>
            <Select
              value={criteria}
              label="정리 기준"
              onChange={(e) => setCriteria(e.target.value)}
            >
              <MenuItem value="type">파일 형식별</MenuItem>
              <MenuItem value="date">날짜별</MenuItem>
              <MenuItem value="size">크기별</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>작업 유형</InputLabel>
            <Select
              value={action}
              label="작업 유형"
              onChange={(e) => setAction(e.target.value)}
            >
              <MenuItem value="move">이동</MenuItem>
              <MenuItem value="copy">복사</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle1" gutterBottom>
          선택된 파일 ({selectedFiles.length})
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {selectedFiles.map(file => (
            <Chip
              key={file.path}
              icon={getFileIcon(file)}
              label={file.name}
              onDelete={() => handleFileSelect(file)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Stack>

        <Typography variant="subtitle1" gutterBottom>
          파일 목록
        </Typography>

        <Box sx={{ 
          maxHeight: 300, 
          overflow: 'auto',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1
        }}>
          {files.map(file => (
            <Box
              key={file.path}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1,
                cursor: 'pointer',
                bgcolor: selectedFiles.find(f => f.path === file.path)
                  ? 'action.selected'
                  : 'transparent',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
              onClick={() => handleFileSelect(file)}
            >
              {getFileIcon(file)}
              <Box sx={{ ml: 1, flexGrow: 1 }}>
                <Typography variant="body2">
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getFileType(file)} • {(file.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button
          onClick={handleOrganize}
          variant="contained"
          disabled={loading || selectedFiles.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {action === 'move' ? '이동' : '복사'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FileOrganizer; 