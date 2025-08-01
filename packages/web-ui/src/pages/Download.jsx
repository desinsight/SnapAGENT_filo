import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { COLORS, THEME } from '../constants/colors';

export default function Download() {
  return (
    <Box minHeight="100vh" bgcolor={THEME.PAGE.BACKGROUND} display="flex" alignItems="center" justifyContent="center" p={2}>
      <Box width="100%" maxWidth="420px">
        <Card sx={{ borderRadius: 2, boxShadow: THEME.CARD.SHADOW, bgcolor: THEME.CARD.BACKGROUND, border: `1px solid ${THEME.CARD.BORDER}` }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color={COLORS.BRAND.PRIMARY} mb={2}>
              Filo 다운로드
            </Typography>
            <Typography variant="body1" color={COLORS.TEXT.SECONDARY} mb={3}>
              Filo 데스크탑 앱을 설치하여<br />AI 기반 파일 관리의 모든 기능을 경험해보세요.
            </Typography>
            <Button
              variant="contained"
              size="large"
              href="/download/filo-setup-latest.exe"
              sx={{
                bgcolor: COLORS.BRAND.PRIMARY,
                color: COLORS.WHITE,
                fontWeight: 600,
                fontSize: 18,
                py: 1.5,
                borderRadius: 2,
                boxShadow: THEME.BUTTON.PRIMARY.SHADOW,
                '&:hover': { bgcolor: COLORS.BRAND.SECONDARY },
              }}
            >
              Windows 다운로드
            </Button>
            <Typography variant="body2" color={COLORS.TEXT.TERTIARY} mt={2}>
              Mac, Linux 버전은 곧 제공 예정입니다.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
} 