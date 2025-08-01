import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Storage as StorageIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import axios from 'axios';

const DriveList = ({ onDriveSelect }) => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDrives();
  }, []);

  const loadDrives = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/drives');
      setDrives(response.data);
      setError(null);
    } catch (error) {
      setError('드라이브 목록을 불러올 수 없습니다.');
      console.error('드라이브 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const getDriveIcon = (type) => {
    switch (type) {
      case '고정 디스크':
        return <StorageIcon />;
      case '이동식 디스크':
      case 'CD-ROM':
        return <FolderIcon />;
      default:
        return <StorageIcon />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent style={{ textAlign: 'center' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          드라이브 목록
        </Typography>
        <List>
          {drives.map((drive) => (
            <ListItem
              key={drive.name}
              button
              onClick={() => onDriveSelect(drive.path)}
            >
              <ListItemIcon>
                {getDriveIcon(drive.type)}
              </ListItemIcon>
              <ListItemText
                primary={`${drive.name} (${drive.type})`}
                secondary={`사용 가능: ${formatSize(drive.freeSpace)} / 전체: ${formatSize(drive.totalSpace)}`}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default DriveList; 