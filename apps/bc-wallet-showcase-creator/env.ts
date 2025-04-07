import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
 
export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(1),
    AUTH_KEYCLOAK_ID: z.string().min(1),
    AUTH_KEYCLOAK_SECRET: z.string().min(1),
    AUTH_KEYCLOAK_ISSUER: z.string().url(),
    SHOWCASE_BACKEND: z.string().url(),
    WALLET_URL: z.string().url(),
  },
  experimental__runtimeEnv: process.env,
});