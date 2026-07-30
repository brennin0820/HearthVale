import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  publicDir: resolve(__dirname, '../data'),
  server: {
    fs: { allow: [resolve(__dirname, '..')] },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
