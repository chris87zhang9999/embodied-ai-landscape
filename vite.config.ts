import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type {} from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  base: '/embodied-ai-landscape/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
})
