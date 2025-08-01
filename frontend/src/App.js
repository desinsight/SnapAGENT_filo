import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import FileExplorer from './components/FileExplorer';

function App() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          MCP 파일 탐색기
        </Typography>
        <FileExplorer />
      </Box>
    </Container>
  );
}

export default App; 