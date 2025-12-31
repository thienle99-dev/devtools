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
      },
      preload: {
        // Synonym for `input`
        input: 'electron/preload/preload.ts',
      },
      // Optional: Use Node.js API in the Renderer-process
      renderer: {},
    }),
  ],
})
