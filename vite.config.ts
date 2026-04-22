/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Strip the `crossorigin` attribute Vite adds to <script>/<link> tags.
// We serve all assets same-origin through Caddy; CORS headers are not set
// on the origin, and Safari treats a crossorigin-marked stylesheet without
// Access-Control-Allow-Origin as a fetch failure, leading to unstyled pages.
const stripCrossorigin = {
  name: 'strip-crossorigin',
  transformIndexHtml(html: string) {
    return html.replace(/\s+crossorigin(="[^"]*")?/g, '');
  },
};

export default defineConfig({
  plugins: [react(), stripCrossorigin],
  server: {
    // Allow subdomain access: rvcc.localhost, crestmont.localhost
    host: true,
    proxy: {
      '/api': {
        target: process.env.SPORTS_API_URL ?? 'https://sda.dock108.dev',
        changeOrigin: true,
        secure: true,
        headers: {
          // SPORTS_API_KEY must be set in .env.local — no hardcoded fallback
          ...(process.env.SPORTS_API_KEY ? { 'X-API-Key': process.env.SPORTS_API_KEY } : {}),
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: true,
    exclude: ['**/node_modules/**', '**/dist/**', 'mini-golf-break/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test-setup.ts', 'src/**/*.test.{ts,tsx}', 'src/vite-env.d.ts'],
    },
  },
})
