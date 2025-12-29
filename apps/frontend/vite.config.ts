// @ts-nocheck - Version mismatch between vite and vitest types
import { defineConfig, loadEnv } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
  const socketUrl = env.VITE_SOCKET_URL || (() => {
    const baseUrl = apiBaseUrl.replace(/\/api\/v\d+$/, '').replace(/\/api$/, '');
    return baseUrl || 'http://localhost:3001';
  })();

  const getProxyTarget = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return url.includes('://') ? url : `http://${url}`;
    }
  };

  const apiProxyTarget = getProxyTarget(apiBaseUrl);
  const socketProxyTarget = getProxyTarget(socketUrl);

  return {
    plugins: [react(), basicSsl()],
    define: {
      global: 'globalThis',
      'process.env': {},
      process: {
        env: {},
        browser: true,
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      port: parseInt(env.VITE_PORT || '5173', 10),
      https: env.VITE_HTTPS !== 'false',
      host: env.VITE_HOST !== 'false',
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: env.VITE_PROXY_SECURE === 'true',
        },
        '/socket.io': {
          target: socketProxyTarget,
          changeOrigin: true,
          ws: true,
          secure: env.VITE_PROXY_SECURE === 'true',
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
      setupFiles: './src/setupTests.ts',
      css: true,
    },
  };
});