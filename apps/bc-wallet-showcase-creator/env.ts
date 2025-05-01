import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

const runtimeClientSchema = {
  NEXT_PUBLIC_WALLET_URL: z.string().min(1),
  NEXT_PUBLIC_SHOWCASE_API_URL: z.string().min(1),
}

const runtimeClientProcess = {
  NEXT_PUBLIC_WALLET_URL:
    typeof window !== 'undefined' && window.__env?.WALLET_URL
      ? window.__env.WALLET_URL
      : process.env.NEXT_PUBLIC_WALLET_URL,
  NEXT_PUBLIC_SHOWCASE_API_URL:
    typeof window !== 'undefined' && window.__env?.SHOWCASE_API_URL
      ? window.__env.SHOWCASE_API_URL
      : process.env.NEXT_PUBLIC_SHOWCASE_API_URL,
}

export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(1),
    AUTH_KEYCLOAK_ID: z.string().min(1),
    AUTH_KEYCLOAK_SECRET: z.string().min(1),
    AUTH_KEYCLOAK_ISSUER: z.string().min(1),
    AUTH_TRUST_HOST: z.string().default('true'),
    AUTH_REDIRECT_PROXY_URL: z.string().min(1),
    AUTH_URL: z.string().min(1),
    NEXT_AUTH_URL: z.string().min(1),
  },
  client: runtimeClientSchema,
  runtimeEnv: {
    AUTH_SECRET: process.env.OIDC_CLIENT_SECRET,
    AUTH_KEYCLOAK_ID: process.env.OIDC_CLIENT_ID,
    AUTH_KEYCLOAK_SECRET: process.env.OIDC_CLIENT_SECRET,
    AUTH_KEYCLOAK_ISSUER: process.env.OIDC_ISSUER_URL,
    AUTH_TRUST_HOST: process.env.OIDC_TRUST_HOST,
    AUTH_URL: process.env.OIDC_AUTH_URL,
    AUTH_REDIRECT_PROXY_URL: process.env.OIDC_REDIRECT_PROXY_URL,
    NEXT_PUBLIC_WALLET_URL: runtimeClientProcess.NEXT_PUBLIC_WALLET_URL,
    NEXT_PUBLIC_SHOWCASE_API_URL: runtimeClientProcess.NEXT_PUBLIC_SHOWCASE_API_URL,
    NEXT_AUTH_URL: process.env.OIDC_AUTH_URL,
  },
  skipValidation: process.env.NODE_ENV === 'production' || !!process.env.SKIP_ENV_VALIDATION,
})

console.debug('env', env)
console.debug('process.env', process.env)


declare global {
  interface Window {
    __env?: {
      WALLET_URL?: string
      SHOWCASE_API_URL?: string
    }
  }
}