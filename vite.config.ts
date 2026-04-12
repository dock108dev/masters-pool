/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow subdomain access: rvcc.localhost, crestmont.localhost
    host: true,
    proxy: {
      '/api': {
        target: process.env.SPORTS_API_URL ?? 'https://sda.dock108.dev',
        changeOrigin: true,
        secure: true,
        headers: {
          'X-API-Key': process.env.SPORTS_API_KEY ?? '0778e8aed6d6bc38b9d209214a22c11496130957d38a389b8b293028ec538fa1',
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test-setup.ts', 'src/**/*.test.{ts,tsx}', 'src/vite-env.d.ts'],
    },
  },
})
