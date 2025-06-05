mapEnv()

import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

declare global {
  interface Window {
    __env?: {
      NEXT_PUBLIC_WALLET_URL?: string
      NEXT_PUBLIC_SHOWCASE_API_URL?: string
    }
  }
}

const runtimeClientSchema = {
  NEXT_PUBLIC_WALLET_URL: z.string().min(1),
  NEXT_PUBLIC_SHOWCASE_API_URL: z.string().min(1),
}

const getEnv = (key: keyof NonNullable<Window['__env']>): string => {
  if (typeof window === 'undefined') {
    const value = process.env[key]
    return value ?? ''
  } else {
    const value = window.__env?.[key]
    if (!value) {
      throw new Error(`Missing client env: ${key} in window.__env`)
    }
    return value
  }
}

export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(1),
    AUTH_TRUST_HOST: z.string().default('true'),
    AUTH_URL: z.string().min(1),
    OIDC_DEFAULT_TENANT: z.string().min(1),
  },
  client: runtimeClientSchema,
  runtimeEnv: {
    AUTH_SECRET: process.env.NEXT_AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.OIDC_TRUST_HOST,
    AUTH_URL: process.env.OIDC_AUTH_URL,
    OIDC_DEFAULT_TENANT: process.env.OIDC_DEFAULT_TENANT,
    NEXT_PUBLIC_WALLET_URL: getEnv('NEXT_PUBLIC_WALLET_URL'),
    NEXT_PUBLIC_SHOWCASE_API_URL: getEnv('NEXT_PUBLIC_SHOWCASE_API_URL'),
  },
  skipValidation: process.env.NODE_ENV === 'production' || !!process.env.SKIP_ENV_VALIDATION,
})

export function mapEnv() {
  if (process.env.OIDC_AUTH_URL) {
    process.env.NEXTAUTH_URL = process.env.OIDC_AUTH_URL
  }
  if (process.env.OIDC_TRUST_HOST) {
    process.env.AUTH_TRUST_HOST = process.env.OIDC_TRUST_HOST
  }
}
