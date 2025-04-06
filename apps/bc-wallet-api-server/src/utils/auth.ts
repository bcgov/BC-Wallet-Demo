import { Token } from 'keycloak-connect'

export function checkRoles(token: Token, roles: string[]) {
  if (token && !roles.length) return true
  return !!(token && roles.find((role) => token.hasRole(role)))
}
