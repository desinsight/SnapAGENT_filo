import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Download from './pages/Download';
import ProtectedRoute from './ProtectedRoute';
import Profile from './pages/Profile';
import FileExplorer from './components/FileExplorer.jsx';
// AICopilot 페이지 제거됨 - 일렉트론 플로팅창만 사용
import Sync from './pages/Sync';
import Analysis from './pages/Analysis';
import Backup from './pages/Backup';
import Security from './pages/Security';
import Settings from './pages/Settings';
import NavBar from './components/NavBar';

function isElectron() {
  return typeof window !== 'undefined' && window.process && window.process.type === 'renderer';
}

function App() {
  // Electron 환경이면 FileExplorer, 아니면 기존 Home
  return isElectron() ? <FileExplorer /> : (
    <div style={{ background: '#F9FAFB', minHeight: '100vh' }}>
      <NavBar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 0' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/download" element={<Download />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/explorer" element={<FileExplorer />} />
          {/* /copilot 라우트 제거됨 - 일렉트론 앱에서만 사용 */}
          <Route path="/sync" element={<Sync />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/backup" element={<Backup />} />
          <Route path="/security" element={<Security />} />
          <Route path="/settings" element={<Settings />} />
          {/* 잘못된 경로는 홈으로 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App; 