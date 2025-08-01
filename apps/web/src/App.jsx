import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  CircularProgress, 
  Paper, 
  Button, 
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  Container,
  AppBar,
  Toolbar,
  Chip,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import {
  Folder as FolderIcon,
  Description as FileIcon,
  Storage as DriveIcon,
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  TrendingUp as StatsIcon
} from '@mui/icons-material';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Material-UI 테마 설정
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const DriveList = ({ onSelect }) => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const res = await axios.get('/api/drives');
        setDrives(res.data.data || res.data || []);
      } catch (err) {
        setError('드라이브 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchDrives();
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  if (error) return <Box display="flex" justifyContent="center" mt={8}><Typography color="error">{error}</Typography></Box>;

  return (
    <Paper elevation={2} sx={{ maxWidth: 600, margin: '40px auto', padding: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        드라이브 선택
      </Typography>
      <List>
        {drives.length === 0 ? (
          <ListItem>
            <ListItemText primary="표시할 드라이브가 없습니다." />
          </ListItem>
        ) : (
          drives.map((drive, idx) => (
            <ListItem key={drive.name || idx} divider button onClick={() => onSelect(drive.path)}>
              <ListItemText primary={drive.name} secondary={drive.path} />
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
};

const FileList = ({ path, onBack }) => {
  const [files, setFiles] = useState({ directories: [], files: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/files?path=${encodeURIComponent(path)}`);
        setFiles(res.data.data || { directories: [], files: [] });
      } catch (err) {
        setError('파일 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [path]);

  return (
    <Paper elevation={2} sx={{ maxWidth: 900, margin: '40px auto', padding: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Button onClick={onBack} variant="outlined" size="small" sx={{ mr: 2 }}>
          드라이브로 돌아가기
        </Button>
        <Typography variant="h6" fontWeight={600}>{path}</Typography>
        <IconButton onClick={() => window.location.reload()} sx={{ ml: 'auto' }}>
          <RefreshIcon />
        </IconButton>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Typography variant="subtitle1" fontWeight={500}>폴더</Typography>
          <List>
            {files.directories.length === 0 ? (
              <ListItem><ListItemText primary="폴더 없음" /></ListItem>
            ) : (
              files.directories.map((dir) => (
                <ListItem key={dir.path} button onClick={() => window.location.href = `?path=${encodeURIComponent(dir.path)}` }>
                  <ListItemText primary={dir.name} secondary={dir.path} />
                </ListItem>
              ))
            )}
          </List>
          <Typography variant="subtitle1" fontWeight={500} mt={2}>파일</Typography>
          <List>
            {files.files.length === 0 ? (
              <ListItem><ListItemText primary="파일 없음" /></ListItem>
            ) : (
              files.files.map((file) => (
                <ListItem key={file.path}>
                  <ListItemText primary={file.name} secondary={file.path} />
                </ListItem>
              ))
            )}
          </List>
        </>
      )}
    </Paper>
  );
};

const HomeDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalDrives: 0,
    totalFiles: 0,
    totalFolders: 0,
    recentFiles: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const drivesRes = await axios.get('/api/drives');
        const drives = drivesRes.data.data || drivesRes.data || [];
        setStats({
          totalDrives: drives.length,
          totalFiles: 0,
          totalFolders: 0,
          recentFiles: []
        });
      } catch (error) {
        console.error('통계 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const dashboardCards = [
    {
      title: '드라이브 관리',
      description: '시스템의 모든 드라이브를 탐색하고 관리합니다',
      icon: <DriveIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      action: () => onNavigate('drives'),
      color: '#e3f2fd'
    },
    {
      title: '파일 탐색기',
      description: '파일과 폴더를 쉽게 찾고 관리합니다',
      icon: <FolderIcon sx={{ fontSize: 40, color: '#388e3c' }} />,
      action: () => onNavigate('explorer'),
      color: '#e8f5e8'
    },
    {
      title: '고급 검색',
      description: '파일명, 내용, 태그로 빠르게 검색합니다',
      icon: <SearchIcon sx={{ fontSize: 40, color: '#f57c00' }} />,
      action: () => onNavigate('search'),
      color: '#fff3e0'
    },
    {
      title: '클라우드 동기화',
      description: '클라우드 스토리지와 파일을 동기화합니다',
      icon: <UploadIcon sx={{ fontSize: 40, color: '#7b1fa2' }} />,
      action: () => onNavigate('sync'),
      color: '#f3e5f5'
    },
    {
      title: '성능 최적화',
      description: '시스템 성능을 분석하고 최적화합니다',
      icon: <StatsIcon sx={{ fontSize: 40, color: '#d32f2f' }} />,
      action: () => onNavigate('optimize'),
      color: '#ffebee'
    },
    {
      title: '설정',
      description: '시스템 설정과 사용자 환경을 관리합니다',
      icon: <SettingsIcon sx={{ fontSize: 40, color: '#616161' }} />,
      action: () => onNavigate('settings'),
      color: '#fafafa'
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" fontWeight="bold" gutterBottom color="primary">
          Web MCP Server
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={2}>
          지능형 파일 시스템 관리 플랫폼 - 웹 버전
        </Typography>
        <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
          <Chip label={`${stats.totalDrives}개 드라이브`} color="primary" variant="outlined" />
          <Chip label={`${stats.totalFiles}개 파일`} color="secondary" variant="outlined" />
          <Chip label={`${stats.totalFolders}개 폴더`} color="success" variant="outlined" />
        </Box>
      </Box>

      <Grid container spacing={4}>
        {dashboardCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 8
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                <Box 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    backgroundColor: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={card.action}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1
                  }}
                >
                  시작하기
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={8}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          최근 활동
        </Typography>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary">
            아직 활동 내역이 없습니다. 파일을 탐색하거나 검색을 시작해보세요!
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default function WebApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [currentView, setCurrentView] = useState('home');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = params.get('path');
    if (path) {
      setCurrentPath(path);
      setCurrentView('explorer');
    }
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView('home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('login');
    setCurrentView('home');
    setCurrentPath(null);
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
    if (view === 'drives') {
      setCurrentPath(null);
    }
  };

  if (!isLoggedIn) {
    switch (currentPage) {
      case 'forgot-password':
        return (
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <ForgotPassword onPageChange={handlePageChange} />
          </ThemeProvider>
        );
      case 'register':
        return (
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Register onPageChange={handlePageChange} />
          </ThemeProvider>
        );
      default:
        return (
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Login onLogin={handleLogin} onPageChange={handlePageChange} />
          </ThemeProvider>
        );
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box minHeight="100vh" bgcolor="#f7f8fa">
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <HomeIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Web MCP Server - 웹 버전
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton color="inherit" onClick={() => handleNavigate('home')}>
                <HomeIcon />
              </IconButton>
              <IconButton color="inherit" onClick={() => handleNavigate('settings')}>
                <SettingsIcon />
              </IconButton>
              <IconButton color="inherit" onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {currentView === 'home' && <HomeDashboard onNavigate={handleNavigate} />}
        {currentView === 'drives' && !currentPath && (
          <DriveList onSelect={(path) => {
            setCurrentPath(path);
            setCurrentView('explorer');
          }} />
        )}
        {currentView === 'explorer' && currentPath && (
          <FileList 
            path={currentPath} 
            onBack={() => {
              setCurrentPath(null);
              setCurrentView('drives');
            }} 
          />
        )}
        {(currentView === 'search' || currentView === 'sync' || currentView === 'optimize' || currentView === 'settings') && (
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                {currentView === 'search' && '고급 검색'}
                {currentView === 'sync' && '클라우드 동기화'}
                {currentView === 'optimize' && '성능 최적화'}
                {currentView === 'settings' && '설정'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                이 기능은 곧 구현될 예정입니다.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => handleNavigate('home')}
                sx={{ mt: 2 }}
              >
                홈으로 돌아가기
              </Button>
            </Paper>
          </Container>
        )}
      </Box>
    </ThemeProvider>
  );
}