import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  output: 'standalone',
  /* other config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '**/assets/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '**/assets/**',
      },
    ],
    dangerouslyAllowSVG: true,
  },
  transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
  publicRuntimeConfig: {
    staticFolder: '/public',
  },
}

export default withNextIntl(nextConfig)
