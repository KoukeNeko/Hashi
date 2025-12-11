import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const backendHost = env.VITE_BACKEND_HOST || 'localhost';
    const backendPort = env.VITE_BACKEND_PORT || '3847';
    const httpTarget = `http://${backendHost}:${backendPort}`;
    const wsTarget = `ws://${backendHost}:${backendPort}`;

    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
            proxy: {
                '/api': {
                    target: httpTarget,
                    changeOrigin: true,
                },
                '/ws': {
                    target: httpTarget,
                    changeOrigin: true,
                    ws: true,
                },
                '/terminal': {
                    target: wsTarget,
                    changeOrigin: true,
                    ws: true,
                },
                '/logs': {
                    target: wsTarget,
                    changeOrigin: true,
                    ws: true,
                },
                '/novnc': {
                    target: httpTarget,
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
            },
        },
    };
});
