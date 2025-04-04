import { authorizationChecker } from '../auth'
import { Action } from 'routing-controllers'

jest.mock('keycloak-connect')

describe('auth tests', () => {

  const authorizedToken = {
    "exp": 1743772550,
    "iat": 1743772250,
    "auth_time": 1743772249,
    "jti": "7302955c-b738-4985-9cfc-0f122389e665",
    "iss": "http://localhost:8080/realms/BC",
    "aud": "account",
    "sub": "07212d51-94ff-4e03-a8bc-40c41fa06016",
    "typ": "Bearer",
    "azp": "showcase-tenantA",
    "sid": "b62014f6-aef7-491f-9d49-eb21c0609371",
    "acr": "1",
    "allowed-origins": [
      "http://*"
    ],
    "realm_access": {
      "roles": [
        "SHOWCASE_SUPERADMIN",
        "offline_access",
        "uma_authorization",
        "default-roles-bc"
      ]
    },
    "resource_access": {
      "showcase-tenantA": {
        "roles": [
          "SHOWCASE_ADMIN",
          "SHOWCASE_PUBLISHER",
          "SHOWCASE_EDITOR"
        ]
      },
      "account": {
        "roles": [
          "manage-account",
          "manage-account-links",
          "view-profile"
        ]
      }
    },
    "scope": "profile email",
    "email_verified": false,
    "name": "Johnny B. Goode",
    "preferred_username": "jbgoode",
    "given_name": "Johnny B.",
    "family_name": "Goode",
    "email": "jbgoode@testmail.com"
  }

  // --- Define the mock function OUTSIDE the jest.mock call ---
// This makes it easy to reference and configure in your tests.
  const mockValidateAccessToken = jest.fn().mockResolvedValue(true);
  const mockValidateToken = jest.fn().mockResolvedValue(authorizedToken)

// --- Mock the 'keycloak-connect' module ---
  jest.mock('keycloak-connect', () => {
    return jest.fn().mockImplementation(() => {
      console.log('Mock KeycloakConnect constructor called'); // For debugging
      return {
        // Simulate the grantManager property
        grantManager: {
          // Assign our pre-defined mock function to validateAccessToken
          validateAccessToken: mockValidateAccessToken,
          // Add mocks for other grantManager methods if your code uses them
          validateToken: mockValidateToken
        }
      };
    });
  });

  const authorizedAction: Action = {
    request: {
      headers: {
        authorization: authorizedToken
      }
    },
    response: {}
  }

  const clientId = 'showcase-tenantA'

  it('should authorize user with SHOWCASE_ADMIN role', async () => {

    const roles = [`${clientId}:SHOWCASE_ADMIN`]
    await expect(authorizationChecker(authorizedAction, roles)).resolves.toBeTruthy()
  })

  it('should authorize user with SHOWCASE_EDITOR role', async () => {
    const roles = [`${clientId}:SHOWCASE_EDITOR`]
    await expect(authorizationChecker(authorizedAction, roles)).resolves.toBeTruthy()
  })

  it('should authorize user with SHOWCASE_PUBLISHER role', async () => {
    const roles = [`${clientId}:SHOWCASE_PUBLISHER`]
    await expect(authorizationChecker(authorizedAction, roles)).resolves.toBeTruthy()
  })

  it('should authorize user with SHOWCASE_SUPERADMIN role', async () => {
    const roles = ['realm:SHOWCASE_SUPERADMIN']
    await expect(authorizationChecker(authorizedAction, roles)).resolves.toBeTruthy()
  })

  it.skip('should not authorize user with SHOWCASE_RANDOM role', async () => {
    const roles = [
      'realm:SHOWCASE_SUPERADMIN',
      'showcase-tenantA:SHOWCASE_ADMIN',
      'showcase-tenantA:SHOWCASE_EDITOR',
      'showcase-tenantA:SHOWCASE_PUBLISHER'
    ]
    await expect(authorizationChecker(authorizedAction, roles)).resolves.toBeFalsy()
  })

  it.skip('should not authorize user with SHOWCASE_RANDOM role', async () => {
    const roles = [
      'realm:SHOWCASE_SUPERADMIN',
      'showcase-tenantA:SHOWCASE_ADMIN',
      'showcase-tenantA:SHOWCASE_EDITOR',
      'showcase-tenantA:SHOWCASE_PUBLISHER'
    ]
    await expect(authorizationChecker(authorizedAction, roles)).resolves.toBeFalsy()
  })
})
