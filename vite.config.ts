import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    // Dev server: run the demo app, importing straight from src/.
    return {
      root: resolve(__dirname, 'demo'),
      plugins: [react()],
    };
  }

  // Library build: bundle src/index.ts as ESM, externalize peer deps.
  return {
    plugins: [react()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        formats: ['es'],
        fileName: 'index',
      },
      // Vite 8 uses Rolldown; the option is rolldownOptions, not rollupOptions.
      rolldownOptions: {
        external: ['react', 'react-dom', 'react/jsx-runtime', 'pixi.js'],
      },
    },
  };
});
