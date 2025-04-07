import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
 
export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(1),
    AUTH_KEYCLOAK_ID: z.string().min(1),
    AUTH_KEYCLOAK_SECRET: z.string().min(1),
    AUTH_KEYCLOAK_ISSUER: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_SHOWCASE_BACKEND: z.string().url(),
    NEXT_PUBLIC_WALLET_URL: z.string().url(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SHOWCASE_BACKEND: process.env.NEXT_PUBLIC_SHOWCASE_BACKEND,
    NEXT_PUBLIC_WALLET_URL: process.env.NEXT_PUBLIC_WALLET_URL,
  },
});