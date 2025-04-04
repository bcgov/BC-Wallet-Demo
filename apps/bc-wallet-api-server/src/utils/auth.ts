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

  // const decodedToken = {
  //   protectedHeader: {
  //     "alg": "RS256",
  //     "typ": "JWT",
  //     "kid": "rUG2ogSG3gv51N-Z1X_gpDyGh7jkwSNw4zdwJMjPvjM"
  //   },
  //   payload: {
  //     "exp": 1743709067,
  //     "iat": 1743708767,
  //     "auth_time": 1743708766,
  //     "jti": "7b78e574-b8ab-45b5-91cd-b2c5353c2889",
  //     "iss": "http://localhost:8080/realms/BC",
  //     "aud": "account",
  //     "sub": "464610a7-c87a-467f-9292-f9d4f28f45a4",
  //     "typ": "Bearer",
  //     "azp": "showcase-tenantA",
  //     "sid": "e934dc63-ad1f-4567-a15d-efe57eb3e9c2",
  //     "acr": "1",
  //     "allowed-origins": [
  //       "http://*"
  //     ],
  //     "realm_access": {
  //       "roles": [
  //         "SHOWCASE_SUPERADMIN",
  //         "offline_access",
  //         "uma_authorization",
  //         "default-roles-bc"
  //       ]
  //     },
  //     "resource_access": {
  //       "showcase-tenantA": {
  //         "roles": [
  //           "SHOWCASE_ADMIN",
  //           "SHOWCASE_PUBLISHER",
  //           "SHOWCASE_EDITOR"
  //         ]
  //       },
  //       "account": {
  //         "roles": [
  //           "manage-account",
  //           "manage-account-links",
  //           "view-profile"
  //         ]
  //       }
  //     },
  //     "scope": "profile email",
  //     "email_verified": false,
  //     "name": "Zoe Maas",
  //     "preferred_username": "zoe",
  //     "given_name": "Zoe",
  //     "family_name": "Maas",
  //     "email": "zmaas@4sure.tech"
  //   }
  // }
  return checkRoles(validToken, roles)
}

export function checkRoles(token: Token, roles: string[]) {
  if (token && !roles.length) return true
  return !!(token && roles.find((role) => token.hasRole(role)));
}
