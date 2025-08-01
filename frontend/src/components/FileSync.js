import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Sync as SyncIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Folder as FolderIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function FileSync() {
  const [syncStatus, setSyncStatus] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [sourceDir, setSourceDir] = useState('');
  const [targetDir, setTargetDir] = useState('');
  const [conflictStrategy, setConflictStrategy] = useState('newer');
  const [syncProgress, setSyncProgress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSyncStatus();
    const interval = setInterval(loadSyncStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSyncStatus = async () => {
    try {
      const response = await axios.get('/api/sync/status');
      setSyncStatus(response.data);
    } catch (error) {
      console.error('동기화 상태 로드 실패:', error);
    }
  };

  const startSync = async () => {
    try {
      setError(null);
      setSyncProgress({ status: 'starting' });
      
      await axios.post('/api/sync/start', { directory: sourceDir });
      
      setSyncProgress({ status: 'in_progress' });
      const response = await axios.post('/api/sync/execute', {
        sourceDir,
        targetDir,
        options: { conflictStrategy }
      });
      
      setSyncProgress({ status: 'completed', result: response.data });
      setOpenDialog(false);
      loadSyncStatus();
    } catch (error) {
      setError(error.response?.data?.error || '동기화 실패');
      setSyncProgress({ status: 'error', error: error.message });
    }
  };

  const stopSync = async () => {
    try {
      await axios.post('/api/sync/stop', { directory: sourceDir });
      loadSyncStatus();
    } catch (error) {
      console.error('동기화 중지 실패:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'in_progress':
        return <SyncIcon color="primary" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<SyncIcon />}
          onClick={() => setOpenDialog(true)}
        >
          새 동기화 시작
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            동기화 상태
          </Typography>
          <List>
            {syncStatus.map((status, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {getStatusIcon(status.status)}
                </ListItemIcon>
                <ListItemText
                  primary={status.filePath}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="textPrimary">
                        {status.event}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2" color="textSecondary">
                        {new Date(status.timestamp).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => stopSync()}
                    disabled={status.status !== 'in_progress'}
                  >
                    <StopIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>파일 동기화 설정</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="소스 디렉토리"
              fullWidth
              value={sourceDir}
              onChange={(e) => setSourceDir(e.target.value)}
            />
            <TextField
              label="대상 디렉토리"
              fullWidth
              value={targetDir}
              onChange={(e) => setTargetDir(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>충돌 해결 전략</InputLabel>
              <Select
                value={conflictStrategy}
                onChange={(e) => setConflictStrategy(e.target.value)}
              >
                <MenuItem value="newer">최신 파일 유지</MenuItem>
                <MenuItem value="source">소스 파일 유지</MenuItem>
                <MenuItem value="target">대상 파일 유지</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button
            onClick={startSync}
            variant="contained"
            disabled={!sourceDir || !targetDir}
          >
            동기화 시작
          </Button>
        </DialogActions>
      </Dialog>

      {syncProgress && (
        <Dialog open={syncProgress.status !== 'completed'} maxWidth="sm" fullWidth>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6">
                {syncProgress.status === 'starting' && '동기화 준비 중...'}
                {syncProgress.status === 'in_progress' && '동기화 진행 중...'}
                {syncProgress.status === 'error' && '동기화 실패'}
              </Typography>
              {syncProgress.status === 'in_progress' && (
                <LinearProgress />
              )}
              {syncProgress.status === 'error' && (
                <Alert severity="error">
                  {syncProgress.error}
                </Alert>
              )}
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
} 