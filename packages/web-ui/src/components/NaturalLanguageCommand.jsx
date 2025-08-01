import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Chip, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Card,
  CardContent,
  CardActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  Preview as PreviewIcon,
  Analytics as AnalyticsIcon,
  Folder as FolderIcon,
  History as HistoryIcon,
  Lightbulb as LightbulbIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { apiFetch } from '../utils/api';

const NaturalLanguageCommand = ({ onResult, onError }) => {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState(null);
  const inputRef = useRef(null);

  // 아이콘 매핑
  const actionIcons = {
    search: <SearchIcon />,
    sort: <SortIcon />,
    filter: <FilterIcon />,
    preview: <PreviewIcon />,
    analyze: <AnalyticsIcon />,
    organize: <FolderIcon />
  };

  // 색상 매핑
  const actionColors = {
    search: 'primary',
    sort: 'secondary',
    filter: 'info',
    preview: 'success',
    analyze: 'warning',
    organize: 'error'
  };

  useEffect(() => {
    loadHistory();
    loadAnalytics();
    loadPersonalizedSuggestions();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await apiFetch('/api/natural-language/history?limit=10');
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('히스토리 로드 실패:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await apiFetch('/api/natural-language/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('분석 데이터 로드 실패:', error);
    }
  };

  const loadPersonalizedSuggestions = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'default';
      const response = await apiFetch(`/api/natural-language/suggestions/${userId}`);
      const data = await response.json();
      if (data.success) {
        setPersonalizedSuggestions(data.data);
      }
    } catch (error) {
      console.error('개인화 제안 로드 실패:', error);
    }
  };

  const handleCommandSubmit = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    setIsProcessing(true);
    setResult(null);
    setFeedback(null);

    try {
      const context = {
        currentDirectory: localStorage.getItem('currentPath') || '/',
        selectedFiles: JSON.parse(localStorage.getItem('selectedFiles') || '[]'),
        recentActions: commandHistory.slice(-5),
        userPreferences: JSON.parse(localStorage.getItem('userPreferences') || '{}')
      };

      const response = await apiFetch('/api/natural-language/process', {
        method: 'POST',
        body: JSON.stringify({
          command: command.trim(),
          context
        })
      });
      const data = await response.json();
      if (data.success) {
        const resultData = data.data;
        setResult(resultData);
        setSuggestions(resultData.suggestions || []);
        setCommandHistory(prev => [...prev, command.trim()]);
        if (onResult) {
          onResult(resultData);
        }
        setTimeout(() => {
          setFeedback({
            type: 'success',
            message: '명령어가 성공적으로 실행되었습니다!'
          });
        }, 1000);
      }
    } catch (error) {
      console.error('명령어 실행 실패:', error);
      setFeedback({
        type: 'error',
        message: error.response?.data?.error || '명령어 실행 중 오류가 발생했습니다.'
      });
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setCommand(suggestion);
    inputRef.current?.focus();
  };

  const handleHistoryClick = (historyItem) => {
    setCommand(historyItem.command);
    inputRef.current?.focus();
  };

  const handleFeedbackSubmit = async (rating) => {
    if (!result) return;

    try {
      await apiFetch('/api/natural-language/feedback', {
        method: 'POST',
        body: JSON.stringify({
          command: command,
          result: result,
          rating
        })
      });

      setFeedback({
        type: 'success',
        message: '피드백이 저장되었습니다. 감사합니다!'
      });
    } catch (error) {
      console.error('피드백 제출 실패:', error);
    }
  };

  const renderExecutionPlan = (executionPlan) => {
    if (!executionPlan || !executionPlan.steps) return null;

    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            실행 계획
          </Typography>
          <Stepper orientation="vertical">
            {executionPlan.steps.map((step, index) => (
              <Step key={index} active={true} completed={true}>
                <StepLabel>
                  <Typography variant="subtitle2">
                    {step.action}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      label={`예상 시간: ${step.estimatedTime}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">
              총 예상 시간: {executionPlan.totalEstimatedTime}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderResult = (resultData) => {
    if (!resultData) return null;

    const { processedCommand, result } = resultData;
    const action = processedCommand.parsedCommand.primaryAction;

    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {actionIcons[action]}
            <Typography variant="h6" sx={{ ml: 1 }}>
              {processedCommand.parsedCommand.primaryAction} 결과
            </Typography>
            <Chip 
              label={`신뢰도: ${Math.round(processedCommand.confidence * 100)}%`}
              color={processedCommand.confidence > 0.8 ? 'success' : 'warning'}
              size="small"
              sx={{ ml: 'auto' }}
            />
          </Box>

          {renderExecutionPlan(processedCommand.executionPlan)}

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">파싱된 명령어</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <pre style={{ 
                fontSize: '12px', 
                backgroundColor: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px',
                overflow: 'auto'
              }}>
                {JSON.stringify(processedCommand.parsedCommand, null, 2)}
              </pre>
            </AccordionDetails>
          </Accordion>

          {result && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">실행 결과</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <pre style={{ 
                  fontSize: '12px', 
                  backgroundColor: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </AccordionDetails>
            </Accordion>
          )}

          {/* 피드백 UI */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom>
              이 결과가 도움이 되었나요?
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <IconButton
                  key={rating}
                  onClick={() => handleFeedbackSubmit(rating)}
                  size="small"
                >
                  <StarIcon 
                    color={rating <= 3 ? 'error' : 'success'} 
                    fontSize="small"
                  />
                </IconButton>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderSuggestions = () => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <LightbulbIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            개선 제안
          </Typography>
          <Grid container spacing={1}>
            {suggestions.keywordSuggestions?.map((suggestion, index) => (
              <Grid item key={index}>
                <Chip
                  label={suggestion}
                  variant="outlined"
                  onClick={() => handleSuggestionClick(suggestion)}
                  clickable
                />
              </Grid>
            ))}
          </Grid>
          {suggestions.optimizationTips?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                최적화 팁:
              </Typography>
              <List dense>
                {suggestions.optimizationTips.map((tip, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InfoIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={tip} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPersonalizedSuggestions = () => {
    if (!personalizedSuggestions) return null;

    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            개인화 제안
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            자주 사용하는 명령어:
          </Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {personalizedSuggestions.frequentCommands?.slice(0, 4).map((cmd, index) => (
              <Grid item key={index}>
                <Chip
                  label={cmd}
                  variant="outlined"
                  onClick={() => handleSuggestionClick(cmd)}
                  clickable
                  size="small"
                />
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle2" gutterBottom>
            추천 명령어:
          </Typography>
          <Grid container spacing={1}>
            {personalizedSuggestions.suggestedCommands?.slice(0, 4).map((cmd, index) => (
              <Grid item key={index}>
                <Chip
                  label={cmd}
                  variant="outlined"
                  onClick={() => handleSuggestionClick(cmd)}
                  clickable
                  size="small"
                  color="primary"
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            사용 통계
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                총 명령어
              </Typography>
              <Typography variant="h4">
                {analytics.totalCommands}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                성공률
              </Typography>
              <Typography variant="h4" color="success.main">
                {Math.round(analytics.successRate)}%
              </Typography>
            </Grid>
          </Grid>
          
          {analytics.popularCommands?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                인기 명령어:
              </Typography>
              <List dense>
                {analytics.popularCommands.slice(0, 3).map((cmd, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Badge badgeContent={cmd.count} color="primary">
                        <HistoryIcon />
                      </Badge>
                    </ListItemIcon>
                    <ListItemText primary={cmd.command} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        AI 자연어 명령
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        자연어로 파일을 검색하고, 정렬하고, 분석하세요. AI가 당신의 의도를 이해하고 최적의 결과를 제공합니다.
      </Typography>

      {/* 명령어 입력 폼 */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleCommandSubmit}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            placeholder="예: 최근에 수정된 PDF 파일들을 크기순으로 정렬해서 보여줘"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            disabled={isProcessing}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={!command.trim() || isProcessing}
              startIcon={isProcessing ? <CircularProgress size={20} /> : <PlayIcon />}
            >
              {isProcessing ? '처리 중...' : '실행'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setCommand('')}
              disabled={isProcessing}
            >
              초기화
            </Button>
            <Button
              variant="outlined"
              onClick={() => setExpanded(!expanded)}
              startIcon={<ExpandMoreIcon />}
            >
              {expanded ? '접기' : '고급 옵션'}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* 피드백 메시지 */}
      {feedback && (
        <Alert 
          severity={feedback.type} 
          sx={{ mb: 2 }}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      {/* 확장된 옵션 */}
      {expanded && (
        <Box sx={{ mb: 3 }}>
          {renderPersonalizedSuggestions()}
          {renderAnalytics()}
        </Box>
      )}

      {/* 결과 표시 */}
      {result && renderResult(result)}

      {/* 제안 표시 */}
      {renderSuggestions()}

      {/* 히스토리 */}
      {history.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              최근 명령어
            </Typography>
            <List dense>
              {history.slice(0, 5).map((item, index) => (
                <ListItem 
                  key={index}
                  button
                  onClick={() => handleHistoryClick(item)}
                >
                  <ListItemIcon>
                    {actionIcons[item.processedCommand?.parsedCommand?.primaryAction] || <SearchIcon />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.command}
                    secondary={new Date(item.timestamp).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default NaturalLanguageCommand; 