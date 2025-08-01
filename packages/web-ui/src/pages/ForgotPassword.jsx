import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Stack,
  InputAdornment, IconButton, Alert, CircularProgress, Stepper, Step, StepLabel
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { THEME, COLORS } from '../constants/colors';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  // 현재 진행 단계 (0: 이메일 입력, 1: 인증 코드 확인, 2: 새 비밀번호 설정)
  const [step, setStep] = useState(0);
  
  // 폼 데이터 상태 관리
  const [formData, setFormData] = useState({
    email: '',           // 이메일 입력값
    code: '',            // 인증 코드 입력값
    password: '',        // 새 비밀번호 입력값
    confirmPassword: ''  // 새 비밀번호 확인 입력값
  });
  
  // UI 상태 관리
  const [showPassword, setShowPassword] = useState(false);        // 새 비밀번호 보기/숨기기 토글
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // 비밀번호 확인 보기/숨기기 토글
  const [loading, setLoading] = useState(false);                 // 로딩 상태
  const [error, setError] = useState('');                        // 에러 메시지
  const [success, setSuccess] = useState('');                    // 성공 메시지

  // 진행 단계 라벨
  const steps = ['이메일', '코드 확인', '비밀번호 설정'];

  const navigate = useNavigate();

  /**
   * 입력 필드 변경 핸들러
   * @param {string} field - 변경할 필드명 (email, code, password, confirmPassword)
   * @param {any} value - 새로운 값
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 입력 시 기존 에러 메시지 제거
    if (error) setError('');
  };

  /**
   * 인증 코드 전송 핸들러
   */
  const handleSendCode = async () => {
    if (!formData.email) {
      setError('이메일을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '인증코드 전송에 실패했습니다.');
      setSuccess('인증 코드가 이메일로 전송되었습니다. (콘솔에서 확인)');
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 인증 코드 확인 핸들러
   */
  const handleVerifyCode = async () => {
    if (!formData.code) {
      setError('인증 코드를 입력해주세요.');
      return;
    }
    // 실제 서버에서는 인증코드만 확인하는 별도 API가 없으므로, 2단계는 프론트에서만 진행
    setStep(2);
    setSuccess('인증이 완료되었습니다.');
  };

  /**
   * 비밀번호 재설정 핸들러
   */
  const handleResetPassword = async () => {
    if (!formData.password || !formData.confirmPassword) {
      setError('비밀번호를 모두 입력해주세요.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: formData.code, newPassword: formData.password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '비밀번호 변경에 실패했습니다.');
      setSuccess('비밀번호가 성공적으로 변경되었습니다.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 현재 단계에 따른 콘텐츠 렌더링
   * @returns {JSX.Element} 단계별 폼 콘텐츠
   */
  const renderStepContent = () => {
    switch (step) {
      case 0: // 이메일 입력 단계
        return (
          <Stack spacing={3}>
            <Typography variant="body1" color={COLORS.TEXT.SECONDARY} textAlign="center">
              가입하신 이메일 주소를 입력하시면<br />
              비밀번호 재설정 인증 코드를 보내드립니다.
            </Typography>
            
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

            {/* 인증 코드 전송 버튼 */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSendCode}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ 
                fontWeight: 600, 
                py: 1.5,
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
              {loading ? '전송 중...' : '인증 코드 전송'}
            </Button>
          </Stack>
        );

      case 1: // 인증 코드 확인 단계
        return (
          <Stack spacing={3}>
            <Typography variant="body1" color={COLORS.TEXT.SECONDARY} textAlign="center">
              {formData.email}로 전송된 6자리 인증 코드를 입력해주세요.
            </Typography>
            
            {/* 인증 코드 입력 필드 */}
            <TextField
              label="인증 코드"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              fullWidth
              required
              disabled={loading}
              placeholder="123456"
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
                style: { textAlign: 'center', letterSpacing: 2 }
              }}
            />

            {/* 인증 코드 확인 버튼 */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleVerifyCode}
              disabled={loading}
              sx={{ 
                fontWeight: 600, 
                py: 1.5,
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
              {loading ? '확인 중...' : '인증 코드 확인'}
            </Button>
          </Stack>
        );

      case 2: // 새 비밀번호 설정 단계
        return (
          <Stack spacing={3}>
            <Typography variant="body1" color={COLORS.TEXT.SECONDARY} textAlign="center">
              새로운 비밀번호를 설정해주세요.
            </Typography>
            
            {/* 새 비밀번호 입력 필드 */}
            <TextField
              label="새 비밀번호"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              fullWidth
              required
              disabled={loading}
              placeholder="영문, 숫자, 특수문자 포함 8자 이상"
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

            {/* 새 비밀번호 확인 입력 필드 */}
            <TextField
              label="새 비밀번호 확인"
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

            {/* 비밀번호 변경 버튼 */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleResetPassword}
              disabled={loading}
              sx={{ 
                fontWeight: 600, 
                py: 1.5,
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
              {loading ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </Stack>
        );

      default:
        return null;
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
      {/* 비밀번호 재설정 폼 컨테이너 */}
      <Box width="100%" maxWidth="450px">
        {/* 브랜딩 헤더 */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight={700} color={COLORS.TEXT.PRIMARY} mb={2}>
            Filo
          </Typography>
          <Typography color={COLORS.TEXT.SECONDARY} variant="body1">
            비밀번호 재설정
          </Typography>
        </Box>

        {/* 비밀번호 재설정 폼 카드 */}
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

            {/* 진행 단계 표시 */}
            <Stepper activeStep={step} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel sx={{
                    '& .MuiStepLabel-label': {
                      color: COLORS.TEXT.SECONDARY,
                    },
                    '&.Mui-active .MuiStepLabel-label': {
                      color: THEME.BRAND.PRIMARY,
                    },
                    '&.Mui-completed .MuiStepLabel-label': {
                      color: THEME.BRAND.PRIMARY,
                    },
                  }}>
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* 단계별 폼 콘텐츠 */}
            {renderStepContent()}

            {/* 에러 메시지 표시 */}
            {error && (
              <Alert severity="error" sx={{ 
                mt: 2, 
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
                mt: 2, 
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
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
} 