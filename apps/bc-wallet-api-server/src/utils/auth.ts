import { Action } from 'routing-controllers'
import Keycloak, { Token } from 'keycloak-connect'
import { jwtDecode } from 'jwt-decode'

export async function authorizationChecker(action: Action, roles: string[]): Promise<boolean> {
  const accessToken: string = action.request.headers['authorization'];
  const keycloak = new Keycloak()
  // Calls the introspection endpoint to check if the token is active
  if (!await keycloak.grantManager.validateAccessToken(accessToken)) {
    return false
  }
  const decodedToken = jwtDecode<Token>(accessToken)
  // Validates the claims and the signature of the token
  const validToken = await keycloak.grantManager.validateToken(decodedToken)

  return checkRoles(validToken, roles)
}

export function checkRoles(token: Token, roles: string[]) {
  if (token && !roles.length) return true
  return !!(token && roles.find((role) => token.hasRole(role)));
}
