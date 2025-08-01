import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Checkbox, FormControlLabel, Link, Stack,
  InputAdornment, IconButton, Alert, CircularProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { THEME, COLORS } from '../constants/colors';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../AuthContext.jsx';

export default function Login({ onLogin }) {
  // 폼 데이터 상태 관리
  const [formData, setFormData] = useState({
    email: '',        // 이메일 입력값
    password: '',     // 비밀번호 입력값
    remember: false   // 로그인 상태 유지 체크박스
  });
  
  // UI 상태 관리
  const [showPassword, setShowPassword] = useState(false);  // 비밀번호 보기/숨기기 토글
  const [loading, setLoading] = useState(false);           // 로딩 상태
  const [error, setError] = useState('');                  // 에러 메시지

  const navigate = useNavigate();
  const { login: setAuth } = useAuth();

  /**
   * 입력 필드 변경 핸들러
   * @param {string} field - 변경할 필드명 (email, password, remember)
   * @param {any} value - 새로운 값
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 입력 시 기존 에러 메시지 제거
    if (error) setError('');
  };

  /**
   * 로그인 폼 제출 핸들러
   * @param {Event} e - 폼 제출 이벤트
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // API 기본 URL 설정 (환경에 따라 다름)
      const apiBaseUrl = import.meta.env.VITE_API_URL || '';
      const loginUrl = `${apiBaseUrl}/api/access/login`;
      
      console.log('로그인 요청 URL:', loginUrl);
      
      const response = await apiFetch(loginUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password 
        })
      });
      
      console.log('로그인 응답 상태:', response.status);
      
      const result = await response.json();
      console.log('로그인 응답:', result);
      
      if (!response.ok) {
        throw new Error(result.error || result.message || '로그인에 실패했습니다.');
      }
      
      if (result.success) {
        // 로그인 성공 시 토큰 저장
        if (result.data && result.data.token) {
          localStorage.setItem('authToken', result.data.token);
          localStorage.setItem('user', JSON.stringify(result.data.user));
        }
        
        // 로그인 성공 콜백 호출
        onLogin && onLogin(result.data);
        // 홈으로 이동
        navigate('/');
      } else {
        throw new Error(result.error || '로그인에 실패했습니다.');
      }
      
    } catch (err) {
      console.error('로그인 오류:', err);
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // 전체 페이지 컨테이너
    <Box 
      minHeight="100vh" 
      bgcolor={THEME.PAGE.BACKGROUND}
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      p={2}
    >
      {/* 로그인 폼 컨테이너 */}
      <Box width="100%" maxWidth="400px">
        {/* 브랜딩 헤더 */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight={700} color={COLORS.TEXT.PRIMARY} mb={2}>
            Filo
          </Typography>
          <Typography variant="subtitle1" color={COLORS.TEXT.SECONDARY} mb={1}>
            AI 파일 매니저
          </Typography>
          <Typography color={COLORS.TEXT.SECONDARY} variant="body1">
            로그인하여 서비스를 이용하세요
          </Typography>
        </Box>

        {/* 로그인 폼 카드 */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: `0 4px 6px -1px ${COLORS.SHADOW.MEDIUM}`,
          bgcolor: THEME.CARD.BACKGROUND,
          border: `1px solid ${THEME.CARD.BORDER}`
        }}>
          <CardContent sx={{ p: 4 }}>
            {/* 폼 제목 */}
            <Typography variant="h5" fontWeight={600} textAlign="center" mb={3} color={COLORS.TEXT.PRIMARY}>
              로그인
            </Typography>

            {/* 로그인 폼 */}
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* 이메일 입력 필드 */}
                <TextField
                  label="이메일"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  fullWidth
                  required
                  disabled={loading}
                  placeholder="example@filo.com"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: THEME.INPUT.BACKGROUND,
                      '& fieldset': {
                        borderColor: THEME.INPUT.BORDER,
                      },
                      '&:hover fieldset': {
                        borderColor: THEME.INPUT.FOCUS,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: THEME.INPUT.FOCUS,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: COLORS.TEXT.SECONDARY,
                    },
                    '& .MuiInputBase-input': {
                      color: THEME.INPUT.TEXT,
                    },
                  }}
                />

                {/* 비밀번호 입력 필드 */}
                <TextField
                  label="비밀번호"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  fullWidth
                  required
                  disabled={loading}
                  placeholder="********"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: THEME.INPUT.BACKGROUND,
                      '& fieldset': {
                        borderColor: THEME.INPUT.BORDER,
                      },
                      '&:hover fieldset': {
                        borderColor: THEME.INPUT.FOCUS,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: THEME.INPUT.FOCUS,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: COLORS.TEXT.SECONDARY,
                    },
                    '& .MuiInputBase-input': {
                      color: THEME.INPUT.TEXT,
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {/* 비밀번호 보기/숨기기 토글 버튼 */}
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={loading}
                          sx={{ color: COLORS.GRAY[400] }}
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                {/* 로그인 상태 유지 & 비밀번호 찾기 */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  {/* 로그인 상태 유지 체크박스 */}
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={formData.remember} 
                        onChange={(e) => handleInputChange('remember', e.target.checked)} 
                        disabled={loading}
                        sx={{
                          color: THEME.BRAND.PRIMARY,
                          '&.Mui-checked': {
                            color: THEME.BRAND.PRIMARY,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontSize: 14 }}>
                        로그인 상태 유지
                      </Typography>
                    }
                  />
                  {/* 비밀번호 찾기 링크 */}
                  <Link 
                    component="button"
                    variant="body2"
                    onClick={() => navigate('/forgot-password')}
                    disabled={loading}
                    sx={{ 
                      textDecoration: 'none',
                      color: THEME.BRAND.PRIMARY,
                      '&:hover': {
                        color: THEME.BRAND.DARK,
                      },
                      fontSize: 14,
                    }}
                  >
                    비밀번호 찾기
                  </Link>
                </Box>

                {/* 에러 메시지 표시 */}
                {error && (
                  <Alert severity="error" sx={{ 
                    fontSize: 14,
                    bgcolor: COLORS.STATUS.ERROR,
                    color: COLORS.WHITE,
                    '& .MuiAlert-icon': {
                      color: COLORS.WHITE,
                    },
                  }}>
                    {error}
                  </Alert>
                )}

                {/* 로그인 버튼 */}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  // 로딩 중에만 비활성화
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ 
                    fontWeight: 600, 
                    py: 1.5,
                    fontSize: 16,
                    bgcolor: loading 
                      ? THEME.BUTTON.DISABLED.BACKGROUND 
                      : THEME.BUTTON.PRIMARY.BACKGROUND,
                    color: loading 
                      ? THEME.BUTTON.DISABLED.TEXT 
                      : THEME.BUTTON.PRIMARY.TEXT,
                    '&:hover': {
                      bgcolor: loading 
                        ? THEME.BUTTON.DISABLED.BACKGROUND 
                        : THEME.BUTTON.PRIMARY.HOVER,
                    },
                    '&:disabled': {
                      bgcolor: THEME.BUTTON.DISABLED.BACKGROUND,
                      color: THEME.BUTTON.DISABLED.TEXT,
                    },
                  }}
                >
                  {loading ? '로그인 중...' : '로그인'}
                </Button>
              </Stack>
            </form>

            {/* 회원가입 링크 */}
            <Box mt={3} textAlign="center">
              <Typography variant="body2" color={COLORS.TEXT.SECONDARY} display="inline">
                계정이 없으신가요?{' '}
              </Typography>
              <Link 
                component="button"
                variant="body2"
                onClick={() => navigate('/register')}
                disabled={loading}
                sx={{ 
                  textDecoration: 'none', 
                  fontWeight: 500,
                  color: THEME.BRAND.PRIMARY,
                  '&:hover': {
                    color: THEME.BRAND.DARK,
                  },
                }}
              >
                회원가입
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
} 