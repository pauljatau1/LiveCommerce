import { appNameFor } from './src/config/brand.js';
import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'url'
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Define __dirname equivalent for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Check app environment
const APP_STATE = process.env.VITE_APP_STATE || 'development';

const studioHtml = () => {
  let appName = appNameFor({}), classic = false;
  return { name: 'studio-html', configResolved(config) { const env = { ...loadEnv(config.mode, config.root, ''), ...process.env }; appName = appNameFor(env); classic = /^(true|1)$/i.test(env.VITE_CLASSIC_DASHBOARD || ''); }, transformIndexHtml(html) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${appName.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))} Studio</title>`);
    if (!classic) html = html.replace(/<link\b[^>]*rel=["']icon["'][^>]*>/g, '<link rel="icon" href="data:,">');
    if (!classic) html = html.replace(/<link\b[^>]*href=["']https:\/\/fonts.googleapis.com[^>]*>/gs, tag=>/Fredoka|Nunito/.test(tag) ? tag : '');
    return html;
  } };
};

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5174, // Start from 5174 to avoid conflicts
    strictPort: false, // Automatically try next available port if 5174 is in use
    allowedHosts: ["seller.staging.auqli.live", "seller.production.auqli.live", "seller.auqli.live"],
    watch: {
      usePolling: true,
    },
  },
  plugins: [
    react(),
    studioHtml(),
    // Upload source maps only when a Sentry account is configured
    process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: process.env.VITE_RELEASE_HASH,
      telemetry: false,
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, 'src/Shared'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react', 
            'react-dom', 
            'react-router-dom',
            '@reduxjs/toolkit',
            'react-redux'
          ],
          'ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-avatar',
            '@radix-ui/react-slot',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-accordion',
            '@radix-ui/react-popover',
            '@radix-ui/react-dropdown-menu',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'lucide-react'
          ],
          'material-ui': [
            '@mui/material',
            '@mui/x-date-pickers',
            '@emotion/react',
            '@emotion/styled'
          ],
          'icons': [
            '@iconify/react',
            'react-icons'
          ],
          'charting': [
            'recharts'
          ]
        }
      }
    },
    sourcemap: true,
  },
  esbuild: {
    drop: APP_STATE === 'production' ? ['console', 'debugger'] : [],
  }
})
