import { fileURLToPath } from 'node:url'
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
  build: {
    // Two entry points: the game (index.html) and the internal sales page
    // (sales.html, Phase 5) — without this, `npm run build` only picks up
    // index.html and silently drops the sales page from production output.
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        sales: fileURLToPath(new URL('sales.html', import.meta.url)),
      },
    },
  },
})
