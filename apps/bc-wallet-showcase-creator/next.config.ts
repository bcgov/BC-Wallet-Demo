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
        hostname: 'localhost',
      },
    ],
    dangerouslyAllowSVG: true,
  },
  transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],
};

export default withNextIntl(nextConfig);