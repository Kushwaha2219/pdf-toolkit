import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server runs on :3000 and proxies /api/* to Flask on :5000.
// Production build is emitted straight into Flask's static folder.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../backend/static',
    emptyOutDir: true,
  },
})
