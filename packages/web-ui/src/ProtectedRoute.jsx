import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{textAlign:'center',marginTop:80}}>로딩 중...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
} 