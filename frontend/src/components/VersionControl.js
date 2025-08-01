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
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider
} from '@mui/material';
import {
  Restore as RestoreIcon,
  Compare as CompareIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function VersionControl({ filePath }) {
  const [versions, setVersions] = useState([]);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [comment, setComment] = useState('');
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    if (filePath) {
      loadVersions();
    }
  }, [filePath]);

  const loadVersions = async () => {
    try {
      const response = await axios.get(`/api/version/history/${encodeURIComponent(filePath)}`);
      setVersions(response.data);
    } catch (error) {
      console.error('버전 히스토리 로드 실패:', error);
    }
  };

  const createVersion = async () => {
    try {
      await axios.post('/api/version/create', {
        filePath,
        metadata: { comment }
      });
      setOpenDialog(false);
      setComment('');
      loadVersions();
    } catch (error) {
      console.error('버전 생성 실패:', error);
    }
  };

  const restoreVersion = async (versionHash) => {
    try {
      await axios.post(`/api/version/restore/${versionHash}`);
      loadVersions();
    } catch (error) {
      console.error('버전 복원 실패:', error);
    }
  };

  const compareVersions = async () => {
    if (selectedVersions.length !== 2) return;
    
    try {
      const response = await axios.get(
        `/api/version/compare/${selectedVersions[0]}/${selectedVersions[1]}`
      );
      setComparison(response.data);
      setDialogType('comparison');
      setOpenDialog(true);
    } catch (error) {
      console.error('버전 비교 실패:', error);
    }
  };

  const handleVersionSelect = (versionHash) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionHash)) {
        return prev.filter(hash => hash !== versionHash);
      }
      if (prev.length < 2) {
        return [...prev, versionHash];
      }
      return [prev[1], versionHash];
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setDialogType('create');
            setOpenDialog(true);
          }}
        >
          새 버전 생성
        </Button>
        <Button
          variant="outlined"
          startIcon={<CompareIcon />}
          disabled={selectedVersions.length !== 2}
          onClick={compareVersions}
        >
          버전 비교
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            버전 히스토리
          </Typography>
          <List>
            {versions.map((version) => (
              <React.Fragment key={version.hash}>
                <ListItem
                  button
                  selected={selectedVersions.includes(version.hash)}
                  onClick={() => handleVersionSelect(version.hash)}
                >
                  <ListItemText
                    primary={formatDate(version.timestamp)}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="textPrimary">
                          {version.metadata.comment}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" color="textSecondary">
                          크기: {(version.size / 1024).toFixed(2)} KB
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => restoreVersion(version.hash)}
                    >
                      <RestoreIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {dialogType === 'create' ? '새 버전 생성' : '버전 비교'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'create' ? (
            <TextField
              autoFocus
              margin="dense"
              label="버전 설명"
              fullWidth
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          ) : (
            comparison && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  변경 사항
                </Typography>
                {comparison.differences.map((diff, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      라인 {diff.line}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="error">
                          {diff.version1}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="success.main">
                          {diff.version2}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            {dialogType === 'create' ? '취소' : '닫기'}
          </Button>
          {dialogType === 'create' && (
            <Button onClick={createVersion} variant="contained">
              생성
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
} 