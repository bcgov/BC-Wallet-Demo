import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"

const AUTH_KEYCLOAK_ID = process.env.AUTH_KEYCLOAK_ID
const AUTH_KEYCLOAK_SECRET = process.env.AUTH_KEYCLOAK_SECRET
const AUTH_KEYCLOAK_ISSUER = process.env.AUTH_KEYCLOAK_ISSUER

if (!AUTH_KEYCLOAK_ID || !AUTH_KEYCLOAK_SECRET || !AUTH_KEYCLOAK_ISSUER) {
  throw new Error("Missing Keycloak credentials")
}
 
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Keycloak({
    clientId: process.env.AUTH_KEYCLOAK_ID!,
    clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
    issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
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
    redirect: async ({ url, baseUrl }) => {
      return Promise.resolve(url)
    },
  }
})