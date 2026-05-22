import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: requests to /api are proxied to the NestJS backend (no global prefix),
// stripping the /api segment. Avoids CORS in development.
// Prod: set VITE_API_URL to the backend origin and axios will call it directly.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
