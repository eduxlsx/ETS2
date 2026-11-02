import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const API = process.env.TRUCKPULSE_API ?? 'http://127.0.0.1:5170';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@shared': path.resolve(__dirname, '../shared') } },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    proxy: {
      '/api': API,
      '/ws': { target: API.replace('http', 'ws'), ws: true },
    },
  },
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 1200 },
  test: { environment: 'jsdom', include: ['test/**/*.test.tsx', 'test/**/*.test.ts'], setupFiles: ['test/setup.ts'] },
});
