import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compassApiPlugin } from './server/compassApiPlugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), compassApiPlugin()],
  server: {
    watch: {
      ignored: ['**/.codex/**'],
    },
  },
})
