// @ts-nocheck - Version mismatch between vite and vitest types
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

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
      // Default 5174 so RCC does not collide with TriagePulse on 5173
      port: parseInt(env.VITE_PORT || '5174', 10),
      strictPort: true,
      https: env.VITE_HTTPS !== 'false',
      host: env.VITE_HOST !== 'false',
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:3002',
          changeOrigin: true,
          secure: false, // Allow self-signed certs if backend used them (it doesn't, but safe to add)
        },
        '/socket.io': {
          target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:3002',
          changeOrigin: true,
          ws: true,
          secure: false,
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