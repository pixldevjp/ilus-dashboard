import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': 'https://ilus.app',
      '/auth': 'https://ilus.app',
      '/sanctum': 'https://ilus.app',
    }
  }
})
