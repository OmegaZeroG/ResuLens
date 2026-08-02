import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  test: {
    // jsdom, not the default node environment — component tests need a
    // real (simulated) DOM to render into and query against.
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
  },
})
