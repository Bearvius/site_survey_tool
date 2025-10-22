import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  cacheDir: path.resolve(__dirname, '.vite-cache'),
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
});
