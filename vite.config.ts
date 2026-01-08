import { defineConfig } from 'vite'
import path from 'path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@tools': path.resolve(__dirname, './src/tools'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@pages': path.resolve(__dirname, './src/pages'),
    },
  },
  plugins: [
    react(),
    electron({
      main: {
        // Synonym for `entry`
        entry: 'electron/main/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: [
                'systeminformation', 
                'electron-store', 
                'yt-dlp-wrap',
                'child_process',
                'events',
                'stream',
                'util',
                'path',
                'fs',
                'os'
              ],
            },
          },
        },
      },
      preload: {
        // Synonym for `input`
        input: 'electron/preload/preload.ts',
      },
      // Optional: Use Node.js API in the Renderer-process
      renderer: {},
    }),
  ],
  build: {
    // Optimize bundle size
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split vendor libraries
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react-vendor';
          }
          if (id.includes('framer-motion') || id.includes('sonner') || id.includes('lucide-react')) {
            return 'ui-vendor';
          }
          if (id.includes('@uiw/react-codemirror') || id.includes('@codemirror/view')) {
            return 'editor-vendor';
          }
          if (id.includes('@codemirror/lang-')) {
            return 'codemirror-langs';
          }
          if (id.includes('crypto-js') || id.includes('bcryptjs') || id.includes('uuid') || id.includes('ulid')) {
            return 'crypto-vendor';
          }
          if (id.includes('pdf-lib') || id.includes('jspdf')) {
            return 'pdf-vendor';
          }
          if (id.includes('js-yaml') || id.includes('fast-xml-parser') || id.includes('papaparse') || id.includes('marked')) {
            return 'parser-vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'sonner',
      'lucide-react',
      'zustand',
    ],
  },
})
