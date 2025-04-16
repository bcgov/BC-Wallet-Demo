import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: 'standalone',
  /* other config options here */
  images: {
    remotePatterns: [
      {
        hostname: '*.dev.nborbit.ca',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
  },
  transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],
  publicRuntimeConfig: {
    staticFolder: '/public',
  },
};

export default withNextIntl(nextConfig);