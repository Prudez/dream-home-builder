import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// shared/ lives one level above this project root — allow Vite's dev
// server to serve it so client code can import shared/contract.js directly.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      allow: ['..'],
    },
  },
})
