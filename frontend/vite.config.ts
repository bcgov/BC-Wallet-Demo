/// <reference types="vitest" />
import type { UserConfig } from 'vite'

import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ command, mode }): UserConfig => {
  // Read VITE_BASE_ROUTE from frontend/.env (or the environment) so both the
  // Vite dev server and the production build serve from the same sub-path.
  const env = loadEnv(mode, process.cwd(), '')
  const baseRoute = env.VITE_BASE_ROUTE || '/digital-trust/showcase'
  // Vite requires base to end with /.
  const base = baseRoute.endsWith('/') ? baseRoute : `${baseRoute}/`

  return {
    plugins: [react()],
    base,
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      // Skip gzip size table during CI/Docker — saves noticeable time on large bundles.
      reportCompressedSize: false,
    },
    publicDir: 'public',
    server: {
      port: 3000,
      strictPort: true,
      // Bind to all interfaces so Docker port mapping works inside containers.
      host: command === 'serve' ? true : undefined,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/client/setupTests.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: ['src/index.tsx', 'src/vite-env.d.ts', 'src/**/__tests__/**', 'src/**/*.test.{ts,tsx}'],
      },
    },
  }
})
