/// <reference types="vitest" />
import type { UserConfig } from 'vite'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const productionBase = '/digital-trust/showcase/'

export default defineConfig(
  ({ command }): UserConfig => ({
    plugins: [react()],
    // Dev matches prior CRA behavior (app at /); production keeps subpath for Caddy.
    base: command === 'serve' ? '/' : productionBase,
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
  }),
)
