import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'idy916',
  viewportWidth: 1400,
  viewportHeight: 860,
  env: {
    apiUrl: 'http://localhost:5000',
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.{ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          launchOptions.args.push('--no-sandbox')
          launchOptions.args.push('--disable-dev-shm-usage')
          launchOptions.args.push('--disable-gpu')
          launchOptions.args.push('--disable-webgl')
          launchOptions.args.push('--disable-webgl2')
          launchOptions.args.push('--disable-software-rasterizer')
          launchOptions.args.push('--disable-accelerated-2d-canvas')
        }
        return launchOptions
      })
    },
  },
})
