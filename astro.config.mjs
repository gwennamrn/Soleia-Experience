import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  base: '/',
  publicDir: 'site',
  outDir: 'dist',
  build: {
    format: 'directory',
  },
});
