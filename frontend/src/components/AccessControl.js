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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function AccessControl() {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    groups: [],
    permissions: []
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      switch (activeTab) {
        case 0:
          const usersResponse = await axios.get('/api/access/users');
          setUsers(usersResponse.data);
          break;
        case 1:
          const groupsResponse = await axios.get('/api/access/groups');
          setGroups(groupsResponse.data);
          break;
        case 2:
          const logsResponse = await axios.get('/api/access/logs');
          setAccessLogs(logsResponse.data);
          break;
      }
    } catch (error) {
      setError('데이터 로드 실패: ' + error.message);
    }
  };

  const handleCreateUser = async () => {
    try {
      await axios.post('/api/access/users', formData);
      setOpenDialog(false);
      loadData();
    } catch (error) {
      setError('사용자 생성 실패: ' + error.message);
    }
  };

  const handleCreateGroup = async () => {
    try {
      await axios.post('/api/access/groups', formData);
      setOpenDialog(false);
      loadData();
    } catch (error) {
      setError('그룹 생성 실패: ' + error.message);
    }
  };

  const handleUpdatePermissions = async () => {
    try {
      if (dialogType === 'user') {
        await axios.put(`/api/access/users/${selectedItem.username}/permissions`, {
          permissions: formData.permissions
        });
      } else {
        await axios.put(`/api/access/groups/${selectedItem.name}/permissions`, {
          permissions: formData.permissions
        });
      }
      setOpenDialog(false);
      loadData();
    } catch (error) {
      setError('권한 업데이트 실패: ' + error.message);
    }
  };

  const handleAddToGroup = async () => {
    try {
      await axios.post(`/api/access/groups/${selectedItem.name}/members`, {
        username: formData.username
      });
      setOpenDialog(false);
      loadData();
    } catch (error) {
      setError('그룹 멤버 추가 실패: ' + error.message);
    }
  };

  const handleRemoveFromGroup = async (username, groupName) => {
    try {
      await axios.delete(`/api/access/groups/${groupName}/members/${username}`);
      loadData();
    } catch (error) {
      setError('그룹 멤버 제거 실패: ' + error.message);
    }
  };

  const handleIPAccess = async (ip, action) => {
    try {
      await axios.post(`/api/access/ip/${action}`, { ip });
      loadData();
    } catch (error) {
      setError('IP 접근 제어 실패: ' + error.message);
    }
  };

  const renderUsersTab = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">사용자 관리</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setDialogType('user');
              setFormData({ username: '', password: '', groups: [], permissions: [] });
              setOpenDialog(true);
            }}
          >
            새 사용자
          </Button>
        </Box>
        <List>
          {users.map((user) => (
            <ListItem key={user.username}>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText
                primary={user.username}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="textPrimary">
                      그룹: {user.groups.join(', ')}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2" color="textSecondary">
                      권한: {user.permissions.join(', ')}
                    </Typography>
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setDialogType('user-permissions');
                    setSelectedItem(user);
                    setFormData({ ...user });
                    setOpenDialog(true);
                  }}
                >
                  <EditIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderGroupsTab = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">그룹 관리</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setDialogType('group');
              setFormData({ name: '', permissions: [], members: [] });
              setOpenDialog(true);
            }}
          >
            새 그룹
          </Button>
        </Box>
        <List>
          {groups.map((group) => (
            <ListItem key={group.name}>
              <ListItemIcon>
                <GroupIcon />
              </ListItemIcon>
              <ListItemText
                primary={group.name}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="textPrimary">
                      멤버: {group.members.join(', ')}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2" color="textSecondary">
                      권한: {group.permissions.join(', ')}
                    </Typography>
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setDialogType('group-permissions');
                    setSelectedItem(group);
                    setFormData({ ...group });
                    setOpenDialog(true);
                  }}
                >
                  <EditIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderLogsTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          접근 로그
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>사용자</TableCell>
                <TableCell>작업</TableCell>
                <TableCell>리소스</TableCell>
                <TableCell>IP 주소</TableCell>
                <TableCell>시간</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accessLogs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell>{log.username}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell>{log.ip}</TableCell>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<PersonIcon />} label="사용자" />
          <Tab icon={<GroupIcon />} label="그룹" />
          <Tab icon={<SecurityIcon />} label="접근 로그" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {activeTab === 0 && renderUsersTab()}
      {activeTab === 1 && renderGroupsTab()}
      {activeTab === 2 && renderLogsTab()}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {dialogType === 'user' && '새 사용자 생성'}
          {dialogType === 'group' && '새 그룹 생성'}
          {dialogType === 'user-permissions' && '사용자 권한 수정'}
          {dialogType === 'group-permissions' && '그룹 권한 수정'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {dialogType === 'user' && (
              <>
                <TextField
                  label="사용자 이름"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="비밀번호"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  fullWidth
                />
              </>
            )}
            {dialogType === 'group' && (
              <TextField
                label="그룹 이름"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
              />
            )}
            {(dialogType === 'user-permissions' || dialogType === 'group-permissions') && (
              <FormControl fullWidth>
                <InputLabel>권한</InputLabel>
                <Select
                  multiple
                  value={formData.permissions}
                  onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="read">읽기</MenuItem>
                  <MenuItem value="write">쓰기</MenuItem>
                  <MenuItem value="delete">삭제</MenuItem>
                  <MenuItem value="admin">관리자</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button
            onClick={
              dialogType === 'user'
                ? handleCreateUser
                : dialogType === 'group'
                ? handleCreateGroup
                : handleUpdatePermissions
            }
            variant="contained"
          >
            {dialogType === 'user'
              ? '생성'
              : dialogType === 'group'
              ? '생성'
              : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 