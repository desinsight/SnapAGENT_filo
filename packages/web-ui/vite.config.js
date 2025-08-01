import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: process.env.VITE_PORT ? Number(process.env.VITE_PORT) : 5174,
    strictPort: true, // 지정된 포트를 사용할 수 없으면 오류 발생 (다른 포트로 넘어가지 않음)
    host: '0.0.0.0', // 모든 인터페이스에서 접근 가능
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  preview: {
    port: 4173,
    host: '0.0.0.0'
  }
}); 