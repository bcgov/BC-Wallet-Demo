import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import { env } from "@/env"
 
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Keycloak({
    clientId: env.AUTH_KEYCLOAK_ID!,
    clientSecret: env.AUTH_KEYCLOAK_SECRET!,
    issuer: env.AUTH_KEYCLOAK_ISSUER!,
  })],
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (account && user) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
        token.refreshToken = account.refresh_token
        token.tokenType = account.token_type
        token.user = user
      }
      return token
    },
    async session({ session, token }) {
      // @ts-expect-error: accessToken is not typed
      session.accessToken = token.accessToken
  
      return session
    }
  },
  session: {
    strategy: 'jwt',
  }
})