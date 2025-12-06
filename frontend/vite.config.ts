import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
          '/ws': {
            target: 'http://localhost:8080',
            changeOrigin: true,
            ws: true,
          },
          '/terminal': {
            target: 'ws://localhost:8080',
            changeOrigin: true,
            ws: true,
          },
          '/logs': {
            target: 'ws://localhost:8080',
            changeOrigin: true,
            ws: true,
          },
          '/novnc': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      define: {
        global: 'globalThis', //sockjs-client 需要這行
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
