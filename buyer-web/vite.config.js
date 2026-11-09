import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { BRAND_NAME } from './src/config.js';

// Fills %BRAND_NAME% in index.html from src/config.js, so the name lives in one place.
const brandName = () => ({
  name: 'brand-name',
  transformIndexHtml: (html) => html.replaceAll('%BRAND_NAME%', BRAND_NAME),
});

export default defineConfig({
  plugins: [react(), brandName()],
  server: { port: 5175 },
  build: { chunkSizeWarningLimit: 1500 },
});
