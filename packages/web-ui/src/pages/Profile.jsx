import React from 'react';
import { useAuth } from '../AuthContext.jsx';

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      <h2 style={{ marginBottom: 24 }}>내 정보</h2>
      <div style={{ marginBottom: 12 }}><b>이름:</b> {user.name}</div>
      <div style={{ marginBottom: 12 }}><b>이메일:</b> {user.email}</div>
      <div style={{ marginBottom: 12 }}><b>권한:</b> {user.role}</div>
    </div>
  );
} 