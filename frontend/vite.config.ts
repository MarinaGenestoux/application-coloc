import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Check if TLS is enabled via environment variable
const TLS_ENABLED = process.env.VITE_TLS_ENABLED === 'true'
const API_PROTOCOL = TLS_ENABLED ? 'https' : 'http'
const API_PORT = process.env.VITE_API_PORT || '8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `${API_PROTOCOL}://localhost:${API_PORT}`,
        changeOrigin: true,
        // Accept self-signed certificates in development
        secure: false,
      },
    },
  },
})
