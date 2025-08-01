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
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function CloudStorage() {
  const [selectedProvider, setSelectedProvider] = useState('gcp');
  const [files, setFiles] = useState([]);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState(null);
  const [credentials, setCredentials] = useState({
    gcp: { projectId: '', keyFilename: '' },
    aws: { region: '', accessKeyId: '', secretAccessKey: '' },
    dropbox: { accessToken: '' }
  });

  useEffect(() => {
    loadFiles();
  }, [selectedProvider]);

  const loadFiles = async () => {
    try {
      const response = await axios.get(`/api/cloud/${selectedProvider}/files`);
      setFiles(response.data);
    } catch (error) {
      setError('파일 목록 로드 실패: ' + error.message);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    try {
      setError(null);
      setUploadProgress({ status: 'uploading', progress: 0 });

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('provider', selectedProvider);
      formData.append('credentials', JSON.stringify(credentials[selectedProvider]));

      const response = await axios.post('/api/cloud/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress({ status: 'uploading', progress });
        }
      });

      setUploadProgress({ status: 'completed' });
      setOpenUploadDialog(false);
      loadFiles();
    } catch (error) {
      setError('업로드 실패: ' + error.message);
      setUploadProgress({ status: 'error', error: error.message });
    }
  };

  const handleDownload = async (fileName) => {
    try {
      setError(null);
      const response = await axios.get(`/api/cloud/${selectedProvider}/download/${fileName}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('다운로드 실패: ' + error.message);
    }
  };

  const handleDelete = async (fileName) => {
    try {
      await axios.delete(`/api/cloud/${selectedProvider}/delete/${fileName}`);
      loadFiles();
    } catch (error) {
      setError('삭제 실패: ' + error.message);
    }
  };

  const handleProviderChange = (event, newValue) => {
    setSelectedProvider(newValue);
  };

  const handleCredentialChange = (provider, field, value) => {
    setCredentials(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={selectedProvider} onChange={handleProviderChange}>
          <Tab value="gcp" label="Google Cloud Storage" />
          <Tab value="aws" label="Amazon S3" />
          <Tab value="dropbox" label="Dropbox" />
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => setOpenUploadDialog(true)}
        >
          파일 업로드
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadFiles}
        >
          새로고침
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
            클라우드 파일 목록
          </Typography>
          <List>
            {files.map((file, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <StorageIcon />
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="textPrimary">
                        {file.size} bytes
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2" color="textSecondary">
                        {new Date(file.updated).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleDownload(file.name)}
                    sx={{ mr: 1 }}
                  >
                    <CloudDownloadIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleDelete(file.name)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)}>
        <DialogTitle>파일 업로드</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              type="file"
              onChange={(e) => setUploadFile(e.target.files[0])}
              fullWidth
            />
            {selectedProvider === 'gcp' && (
              <>
                <TextField
                  label="프로젝트 ID"
                  value={credentials.gcp.projectId}
                  onChange={(e) => handleCredentialChange('gcp', 'projectId', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="키 파일 경로"
                  value={credentials.gcp.keyFilename}
                  onChange={(e) => handleCredentialChange('gcp', 'keyFilename', e.target.value)}
                  fullWidth
                />
              </>
            )}
            {selectedProvider === 'aws' && (
              <>
                <TextField
                  label="리전"
                  value={credentials.aws.region}
                  onChange={(e) => handleCredentialChange('aws', 'region', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="액세스 키 ID"
                  value={credentials.aws.accessKeyId}
                  onChange={(e) => handleCredentialChange('aws', 'accessKeyId', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="시크릿 액세스 키"
                  type="password"
                  value={credentials.aws.secretAccessKey}
                  onChange={(e) => handleCredentialChange('aws', 'secretAccessKey', e.target.value)}
                  fullWidth
                />
              </>
            )}
            {selectedProvider === 'dropbox' && (
              <TextField
                label="액세스 토큰"
                value={credentials.dropbox.accessToken}
                onChange={(e) => handleCredentialChange('dropbox', 'accessToken', e.target.value)}
                fullWidth
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>취소</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!uploadFile}
          >
            업로드
          </Button>
        </DialogActions>
      </Dialog>

      {uploadProgress && (
        <Dialog open={uploadProgress.status !== 'completed'} maxWidth="sm" fullWidth>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6">
                {uploadProgress.status === 'uploading' && '업로드 중...'}
                {uploadProgress.status === 'error' && '업로드 실패'}
              </Typography>
              {uploadProgress.status === 'uploading' && (
                <LinearProgress variant="determinate" value={uploadProgress.progress} />
              )}
              {uploadProgress.status === 'error' && (
                <Alert severity="error">
                  {uploadProgress.error}
                </Alert>
              )}
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
} 