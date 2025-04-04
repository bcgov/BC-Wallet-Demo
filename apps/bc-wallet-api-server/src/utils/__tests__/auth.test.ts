import { authorizationChecker, checkRoles } from '../auth'

describe('auth tests', () => {
  const authorizedToken: any = {
    exp: 1743772550,
    iat: 1743772250,
    auth_time: 1743772249,
    jti: '7302955c-b738-4985-9cfc-0f122389e665',
    iss: 'http://localhost:8080/realms/BC',
    aud: 'account',
    sub: '07212d51-94ff-4e03-a8bc-40c41fa06016',
    typ: 'Bearer',
    azp: 'showcase-tenantA',
    sid: 'b62014f6-aef7-491f-9d49-eb21c0609371',
    acr: '1',
    'allowed-origins': ['http://*'],
    realm_access: {
      roles: ['SHOWCASE_SUPERADMIN', 'offline_access', 'uma_authorization', 'default-roles-bc'],
    },
    resource_access: {
      'showcase-tenantA': {
        roles: ['SHOWCASE_ADMIN', 'SHOWCASE_PUBLISHER', 'SHOWCASE_EDITOR'],
      },
      account: {
        roles: ['manage-account', 'manage-account-links', 'view-profile'],
      },
    },
    scope: 'profile email',
    email_verified: false,
    name: 'Johnny B. Goode',
    preferred_username: 'jbgoode',
    given_name: 'Johnny B.',
    family_name: 'Goode',
    email: 'jbgoode@testmail.com',
  }

  const clientId = 'showcase-tenantA'

  it('should authorize user with SHOWCASE_ADMIN role', () => {
    const roles = [`${clientId}:SHOWCASE_ADMIN`]
    expect(checkRoles(authorizedToken, roles)).toBeTruthy()
  })

  it('should authorize user with SHOWCASE_EDITOR role', () => {
    const roles = [`${clientId}:SHOWCASE_EDITOR`]
    expect(checkRoles(authorizedToken, roles)).toBeTruthy()
  })

  it('should authorize user with SHOWCASE_PUBLISHER role', () => {
    const roles = [`${clientId}:SHOWCASE_PUBLISHER`]
    expect(checkRoles(authorizedToken, roles)).toBeTruthy()
  })

  it('should authorize user with SHOWCASE_SUPERADMIN role', () => {
    const roles = ['realm:SHOWCASE_SUPERADMIN']
    expect(checkRoles(authorizedToken, roles)).toBeTruthy()
  })

  it.skip('should not authorize user with SHOWCASE_RANDOM role', () => {
    const roles = [
      'realm:SHOWCASE_SUPERADMIN',
      'showcase-tenantA:SHOWCASE_ADMIN',
      'showcase-tenantA:SHOWCASE_EDITOR',
      'showcase-tenantA:SHOWCASE_PUBLISHER',
    ]
    expect(authorizationChecker(authorizedToken, roles)).toBeFalsy()
  })

  it.skip('should not authorize user with SHOWCASE_RANDOM role', () => {
    const roles = [
      'realm:SHOWCASE_SUPERADMIN',
      'showcase-tenantA:SHOWCASE_ADMIN',
      'showcase-tenantA:SHOWCASE_EDITOR',
      'showcase-tenantA:SHOWCASE_PUBLISHER',
    ]
    expect(checkRoles(authorizedToken, roles)).toBeFalsy()
  })
})
