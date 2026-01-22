/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';

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
      '@plugins': path.resolve(__dirname, './plugins'),
    },
    // Ensure proper resolution for CommonJS modules like zxcvbn
    dedupe: ['zxcvbn'],
  },
  plugins: [
    react(),
    !process.env.VITEST && electron({
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
                'os',
                'adm-zip',
                'axios',
                'fluent-ffmpeg',
                'ffmpeg-static'
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
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      open: false,
    }),
  ].filter(Boolean),
  // @ts-expect-error - Vitest config is merged by Vitest
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [], // Add setup file if needed
  },
  build: {
    sourcemap: false,
    // Optimize bundle size - Phase 2 optimizations
    target: 'esnext',
    minify: 'esbuild', // Using esbuild for faster builds (terser is slower but smaller)
    cssMinify: true,
    reportCompressedSize: false, // Faster builds
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core framework
          if (id.includes('react') && !id.includes('react-dom') && !id.includes('react-router')) {
            return 'react-core';
          }
          if (id.includes('react-dom')) {
            return 'react-dom';
          }
          if (id.includes('react-router-dom')) {
            return 'react-router';
          }
          
          // UI libraries
          if (id.includes('framer-motion')) {
            return 'framer-motion';
          }
          if (id.includes('sonner') || id.includes('lucide-react')) {
            return 'ui-vendor';
          }
          
          // Heavy libraries (lazy loaded, separate chunks)
          if (id.includes('fabric')) {
            return 'fabric';
          }
          if (id.includes('tesseract')) {
            return 'tesseract';
          }
          if (id.includes('zxcvbn')) {
            return 'zxcvbn-vendor';
          }
          
          // Code editor
          if (id.includes('@uiw/react-codemirror') || id.includes('@codemirror/view')) {
            return 'editor-core';
          }
          if (id.includes('@codemirror/lang-')) {
            return 'editor-langs';
          }
          
          // Utilities
          if (id.includes('crypto-js') || id.includes('bcryptjs') || id.includes('uuid') || id.includes('ulid')) {
            return 'crypto-vendor';
          }
          if (id.includes('pdfjs-dist')) {
            return 'pdfjs';
          }
          if (id.includes('pdf-lib') || id.includes('jspdf')) {
            return 'pdf-vendor';
          }
          if (id.includes('jszip')) {
            return 'jszip';
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
  // Optimize dependencies pre-bundling - Phase 2
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'lucide-react',
      'sonner',
    ],
    exclude: [
      'tesseract.js', // Lazy load
      'fabric',       // Lazy load
      'zxcvbn',
      'pdfjs-dist',
    ]
  },
})
