import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
  Breadcrumbs,
  Link,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3000');
    
    websocket.onopen = () => {
      console.log('WebSocket 연결됨');
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.status === 'success') {
        setFiles(response.data);
      } else {
        setError(response.message);
      }
      setLoading(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket 오류:', error);
      setError('서버 연결 오류');
    };

    return () => {
      websocket.close();
    };
  }, []);

  const loadDirectory = async (path) => {
    if (!ws) return;
    
    setLoading(true);
    setError(null);
    setCurrentPath(path);
    
    ws.send(JSON.stringify({
      type: 'list_directory',
      params: { path }
    }));
  };

  const handleSearch = () => {
    if (!ws || !searchQuery) return;
    
    setLoading(true);
    setError(null);
    
    ws.send(JSON.stringify({
      type: 'search_files',
      params: {
        path: currentPath,
        query: searchQuery,
        options: {
          caseSensitive: false
        }
      }
    }));
  };

  const handleRefresh = () => {
    loadDirectory(currentPath);
  };

  const handleFileClick = (file) => {
    if (file.isDirectory) {
      loadDirectory(file.path);
    } else {
      // 파일 미리보기 또는 다운로드 처리
      console.log('파일 선택:', file);
    }
  };

  const renderBreadcrumbs = () => {
    const paths = currentPath.split('\\').filter(Boolean);
    return (
      <Breadcrumbs>
        {paths.map((path, index) => {
          const fullPath = paths.slice(0, index + 1).join('\\');
          return (
            <Link
              key={fullPath}
              component="button"
              variant="body1"
              onClick={() => loadDirectory(fullPath)}
            >
              {path}
            </Link>
          );
        })}
      </Breadcrumbs>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="파일 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <IconButton onClick={handleRefresh}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {renderBreadcrumbs()}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ p: 2 }}>
          {error}
        </Typography>
      ) : (
        <List>
          {files.map((file) => (
            <ListItem
              key={file.path}
              disablePadding
              secondaryAction={
                <Typography variant="body2" color="text.secondary">
                  {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}
                </Typography>
              }
            >
              <ListItemButton onClick={() => handleFileClick(file)}>
                <ListItemIcon>
                  {file.isDirectory ? <FolderIcon /> : <FileIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={new Date(file.modified).toLocaleString()}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

export default FileExplorer; 