import { defineConfig } from 'vite'

import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // Synonym for `entry`
        entry: 'electron/main/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['systeminformation', 'electron-store'],
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
        manualChunks: {
          // Split vendor libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'sonner', 'lucide-react'],
          'editor-vendor': ['@uiw/react-codemirror', '@codemirror/view'],
          'codemirror-langs': [
            '@codemirror/lang-json',
            '@codemirror/lang-yaml',
            '@codemirror/lang-xml',
            '@codemirror/lang-sql',
            '@codemirror/lang-javascript',
            '@codemirror/lang-html',
            '@codemirror/lang-css',
          ],
          'crypto-vendor': ['crypto-js', 'bcryptjs', 'uuid', 'ulid'],
          'pdf-vendor': ['pdf-lib', 'jspdf'],
          'parser-vendor': ['js-yaml', 'fast-xml-parser', 'papaparse', 'marked'],
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
