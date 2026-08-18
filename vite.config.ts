import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** GitHub Pages: https://pranaypsurve.github.io/otp-pro-input/ */
const repoBase = '/otp-pro-input/';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? repoBase : '/',
  root: path.resolve(rootDir, 'playground'),
  plugins: [react()],
  resolve: {
    alias: {
      'otp-pro-input': path.resolve(rootDir, 'src/index.ts'),
    },
  },
  build: {
    outDir: path.resolve(rootDir, 'playground-dist'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
  },
}));
