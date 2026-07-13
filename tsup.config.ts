import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  dts: { only: true },
  format: ['esm'],
  tsconfig: 'tsconfig.build.json',
  outDir: 'dist',
});
