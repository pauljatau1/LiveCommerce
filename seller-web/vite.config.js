import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'url'
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Define __dirname equivalent for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Check app environment
const APP_STATE = process.env.VITE_APP_STATE || 'development';

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
    sentryVitePlugin({
      org: "commercejet",
      project: "auqli-seller",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: process.env.VITE_RELEASE_HASH,
      telemetry: false,
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, 'src/Shared'),
      // Dedupe React to prevent multiple instances
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Large dependencies that should be in their own chunks
          if (id.includes('node_modules')) {
            // Ant Design
            if (id.includes('antd')) {
              return 'antd';
            }
            // Lodash
            if (id.includes('lodash')) {
              return 'lodash';
            }
            // PDF generation
            if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
              return 'pdf';
            }
            // HTML to Canvas
            if (id.includes('html2canvas')) {
              return 'html2canvas';
            }
            // Agora SDK
            if (id.includes('agora-rtc-sdk-ng')) {
              return 'agora';
            }
            // Video/Media
            if (id.includes('hls.js')) {
              return 'hls';
            }
            // TipTap editor
            if (id.includes('@tiptap')) {
              return 'tiptap';
            }
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            // Socket.io
            if (id.includes('socket.io')) {
              return 'socket';
            }
            // Material UI
            if (id.includes('@mui/material') || id.includes('@mui/x-date-pickers') || id.includes('@emotion')) {
              return 'material-ui';
            }
            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            // Icons
            if (id.includes('@iconify') || id.includes('react-icons') || id.includes('lucide-react')) {
              return 'icons';
            }
            // Charts
            if (id.includes('recharts')) {
              return 'charting';
            }
            // Core vendor libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            // Redux
            if (id.includes('redux') || id.includes('@reduxjs')) {
              return 'vendor-redux';
            }
            // Other large vendor libraries
            if (id.includes('axios') || id.includes('dayjs') || id.includes('date-fns') || id.includes('zod')) {
              return 'vendor-utils';
            }
            // Everything else from node_modules
            return 'vendor';
          }
        }
      }
    },
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    // Use esbuild for minification (default, more memory efficient than terser)
    minify: 'esbuild',
  },
  esbuild: {
    drop: APP_STATE === 'production' ? ['console', 'debugger'] : [],
  }
})
