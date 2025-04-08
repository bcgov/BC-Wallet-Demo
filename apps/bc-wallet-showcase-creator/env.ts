import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const runtimeClientSchema = {
  NEXT_PUBLIC_WALLET_URL: z.string().min(1),
  NEXT_PUBLIC_SHOWCASE_BACKEND: z.string().min(1),
};

const runtimeClientProcess = {
  NEXT_PUBLIC_WALLET_URL: 
    typeof window !== "undefined" && window.__env?.WALLET_URL 
      ? window.__env.WALLET_URL 
      : process.env.NEXT_PUBLIC_WALLET_URL,
  NEXT_PUBLIC_SHOWCASE_BACKEND: 
    typeof window !== "undefined" && window.__env?.SHOWCASE_BACKEND 
      ? window.__env.SHOWCASE_BACKEND 
      : process.env.NEXT_PUBLIC_SHOWCASE_BACKEND,
};

export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(1),
    AUTH_KEYCLOAK_ID: z.string().min(1),
    AUTH_KEYCLOAK_SECRET: z.string().min(1),
    AUTH_KEYCLOAK_ISSUER: z.string().min(1),
    AUTH_TRUST_HOST: z.string().default("true"),
    AUTH_REDIRECT_PROXY_URL: z.string().min(1),
  },
  client: runtimeClientSchema,
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_KEYCLOAK_ID: process.env.AUTH_KEYCLOAK_ID,
    AUTH_KEYCLOAK_SECRET: process.env.AUTH_KEYCLOAK_SECRET,
    AUTH_KEYCLOAK_ISSUER: process.env.AUTH_KEYCLOAK_ISSUER,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    AUTH_REDIRECT_PROXY_URL: process.env.AUTH_REDIRECT_PROXY_URL,
    NEXT_PUBLIC_WALLET_URL: runtimeClientProcess.NEXT_PUBLIC_WALLET_URL,
    NEXT_PUBLIC_SHOWCASE_BACKEND: runtimeClientProcess.NEXT_PUBLIC_SHOWCASE_BACKEND,
  },
  skipValidation: process.env.NODE_ENV === "production" || !!process.env.SKIP_ENV_VALIDATION,
});

declare global {
  interface Window {
    __env?: {
      WALLET_URL?: string;
      SHOWCASE_BACKEND?: string;
    };
  }
}