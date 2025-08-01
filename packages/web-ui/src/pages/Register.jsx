import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Checkbox, FormControlLabel, Link, Stack,
  InputAdornment, IconButton, Alert, CircularProgress, Grid
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { THEME, COLORS } from '../constants/colors';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  // 폼 데이터 상태 관리
  const [formData, setFormData] = useState({
    name: '',           // 이름 입력값
    email: '',          // 이메일 입력값
    password: '',       // 비밀번호 입력값
    confirmPassword: '', // 비밀번호 확인 입력값
    agreeTerms: false,  // 이용약관 동의 체크박스
    agreePrivacy: false // 개인정보처리방침 동의 체크박스
  });
  
  // UI 상태 관리
  const [showPassword, setShowPassword] = useState(false);        // 비밀번호 보기/숨기기 토글
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // 비밀번호 확인 보기/숨기기 토글
  const [loading, setLoading] = useState(false);                 // 로딩 상태
  const [error, setError] = useState('');                        // 에러 메시지
  const [success, setSuccess] = useState('');                    // 성공 메시지

  const navigate = useNavigate();

  /**
   * 입력 필드 변경 핸들러
   * @param {string} field - 변경할 필드명 (name, email, password, confirmPassword, agreeTerms, agreePrivacy)
   * @param {any} value - 새로운 값
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 입력 시 기존 에러 메시지 제거
    if (error) setError('');
  };

  /**
   * 이메일 유효성 검사
   * @param {string} email - 검사할 이메일
   * @returns {boolean} 유효성 여부
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * 비밀번호 유효성 검사
   * @param {string} password - 검사할 비밀번호
   * @returns {object} 유효성 검사 결과
   */
  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar
    };
  };

  /**
   * 회원가입 폼 제출 핸들러
   * @param {Event} e - 폼 제출 이벤트
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 기본 유효성 검사
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    // 이름 길이 검사
    if (formData.name.length < 2) {
      setError('이름은 2자 이상이어야 합니다.');
      return;
    }

    // 이메일 유효성 검사
    if (!isValidEmail(formData.email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 비밀번호 유효성 검사
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError('비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.');
      return;
    }

    // 비밀번호 일치 검사
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 약관 동의 검사
    if (!formData.agreeTerms || !formData.agreePrivacy) {
      setError('이용약관과 개인정보처리방침에 동의해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '회원가입에 실패했습니다.');
      setSuccess('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message);
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
      {/* 회원가입 폼 컨테이너 */}
      <Box width="100%" maxWidth="500px">
        {/* 브랜딩 헤더 */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight={700} color={COLORS.TEXT.PRIMARY} mb={2}>
            Filo
          </Typography>
          <Typography color={COLORS.TEXT.SECONDARY} variant="body1">
              회원가입하여 서비스를 이용하세요
          </Typography>
        </Box>

        {/* 회원가입 폼 카드 */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: `0 4px 6px -1px ${COLORS.SHADOW.MEDIUM}`,
          bgcolor: THEME.CARD.BACKGROUND,
          border: `1px solid ${THEME.CARD.BORDER}`
        }}>
          <CardContent sx={{ p: 4 }}>
            {/* 뒤로가기 버튼 */}
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/login')}
              sx={{ 
                mb: 3, 
                color: COLORS.TEXT.SECONDARY,
                '&:hover': {
                  color: THEME.BRAND.PRIMARY,
                },
              }}
            >
              로그인으로 돌아가기
            </Button>

            {/* 폼 제목 */}
            <Typography variant="h5" fontWeight={600} textAlign="center" mb={3} color={COLORS.TEXT.PRIMARY}>
              회원가입
            </Typography>

            {/* 회원가입 폼 */}
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* 이름 입력 필드 */}
                <TextField
                  label="이름"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  fullWidth
                  required
                  disabled={loading}
                  placeholder="이름을 입력하세요"
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
                  placeholder="비밀번호를 입력하세요"
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

                {/* 비밀번호 확인 입력 필드 */}
                <TextField
                  label="비밀번호 확인"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  fullWidth
                  required
                  disabled={loading}
                  placeholder="비밀번호를 한 번 더 입력하세요"
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
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          disabled={loading}
                          sx={{ color: COLORS.GRAY[400] }}
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                {/* 약관 동의 섹션 */}
                <Box>
                  <Typography variant="subtitle2" color={COLORS.TEXT.PRIMARY} mb={2}>
                    약관 동의
                  </Typography>
                  
                  {/* 이용약관 동의 */}
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={formData.agreeTerms} 
                        onChange={(e) => handleInputChange('agreeTerms', e.target.checked)} 
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
                        <Link 
                          href="#" 
                          sx={{ 
                            color: THEME.BRAND.PRIMARY,
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          이용약관
                        </Link>
                        에 동의합니다 (필수)
                      </Typography>
                    }
                  />
                  
                  {/* 개인정보처리방침 동의 */}
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={formData.agreePrivacy} 
                        onChange={(e) => handleInputChange('agreePrivacy', e.target.checked)} 
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
                        <Link 
                          href="#" 
                          sx={{ 
                            color: THEME.BRAND.PRIMARY,
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          개인정보처리방침
                        </Link>
                        에 동의합니다 (필수)
                      </Typography>
                    }
                  />
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

                {/* 성공 메시지 표시 */}
                {success && (
                  <Alert severity="success" sx={{ 
                    fontSize: 14,
                    bgcolor: COLORS.STATUS.SUCCESS,
                    color: COLORS.WHITE,
                    '& .MuiAlert-icon': {
                      color: COLORS.WHITE,
                    },
                  }}>
                    {success}
                  </Alert>
                )}

                {/* 회원가입 버튼 */}
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
                  {loading ? '가입 중...' : '회원가입'}
                </Button>
              </Stack>
            </form>

            {/* 로그인 링크 */}
            <Box mt={3} textAlign="center">
              <Typography variant="body2" color={COLORS.TEXT.SECONDARY} display="inline">
                이미 계정이 있으신가요?{' '}
              </Typography>
              <Link 
                component="button"
                variant="body2"
                onClick={() => navigate('/login')}
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
                로그인
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
} 