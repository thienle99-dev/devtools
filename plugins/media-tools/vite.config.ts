import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react() as any],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      '@utils': resolve(__dirname, '../../src/utils'),
      '@components': resolve(__dirname, '../../src/components'),
      '@store': resolve(__dirname, '../../src/store'),
      '@hooks': resolve(__dirname, '../../src/hooks'),
      '@types': resolve(__dirname, '../../src/types'),
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MediaTools',
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
