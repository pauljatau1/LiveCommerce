import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'url'
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Define __dirname equivalent for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
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
    drop: ['console', 'debugger'], // Remove console and debugger statements in production
  }
})
