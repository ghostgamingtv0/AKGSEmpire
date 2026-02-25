import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Dev server restricted to prevent bypass of Cloudflare proxy
  server: {
    host: '127.0.0.1', // Restricted to local loopback
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Security: disable sourcemaps in production
  }
})
