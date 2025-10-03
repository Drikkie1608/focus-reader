import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  define: {
    global: 'globalThis'
  },
  worker: {
    format: 'es'
  }
})
