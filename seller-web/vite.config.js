import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath } from 'url'
import viteCompression from 'vite-plugin-compression'

// Define __dirname equivalent for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    allowedHosts: ["seller.staging.auqli.live", "seller.production.auqli.live", "seller.auqli.live"]
  },
  plugins: [
    react(),
    visualizer({
      open: true, // Open visualizer when bundle is built
      gzipSize: true, // Show gzipped sizes
      brotliSize: true, // Show brotli sizes
      filename: 'stats.html' // Output file
    }),
    viteCompression({
      algorithm: 'gzip', // Use gzip compression
      ext: '.gz', // Output file extension
      threshold: 10240, // Only compress files larger than 10kb
      deleteOriginFile: false, // Keep the original files
      filter: /\.(js|css|html|svg|json)$/i, // Only compress certain file types
    }),
    // Brotli compression for even smaller files
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
      filter: /\.(js|css|html|svg|json)$/i,
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Minimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console statements
        drop_debugger: true, // Remove debugger statements
      },
    },
    // Split chunks more efficiently
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
    // Reduce code splitting for smaller overall bundle size (fewer HTTP requests)
    chunkSizeWarningLimit: 1000
  }
})
