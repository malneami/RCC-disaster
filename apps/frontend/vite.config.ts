// @ts-nocheck - Version mismatch between vite and vitest types
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
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
    port: 5173,
    https: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://10.138.40.24:3001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://10.138.40.24:3001',
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
});