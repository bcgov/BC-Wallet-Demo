// Admin portal E2E tests — Keycloak is mocked via cy.intercept.
//
// Session storage is seeded with a fake OIDC user before page load so that
// oidc-client-ts considers the user authenticated without a real token exchange.
//
// The Keycloak logout endpoint is intercepted and immediately redirected back
// to the app's post_logout_redirect_uri. chromeWebSecurity: false (in
// cypress.config.ts) is required to allow the cross-origin navigation before
// Cypress intercepts it.

const ADMIN_PATH = '/digital-trust/showcase/admin'
const CREATOR_PATH = `${ADMIN_PATH}/creator`

// Must match the values in frontend/.env
const KEYCLOAK_BASE = 'http://localhost:8080/realms/showcase'
const KEYCLOAK_CLIENT_ID = 'showcase-admin'

// key used by oidc-client-ts to store the authenticated user
const SESSION_KEY = `oidc.user:${KEYCLOAK_BASE}:${KEYCLOAK_CLIENT_ID}`

const MOCK_OIDC_DISCOVERY = {
  issuer: KEYCLOAK_BASE,
  authorization_endpoint: `${KEYCLOAK_BASE}/protocol/openid-connect/auth`,
  token_endpoint: `${KEYCLOAK_BASE}/protocol/openid-connect/token`,
  end_session_endpoint: `${KEYCLOAK_BASE}/protocol/openid-connect/logout`,
  jwks_uri: `${KEYCLOAK_BASE}/protocol/openid-connect/certs`,
  response_types_supported: ['code'],
  subject_types_supported: ['public'],
  id_token_signing_alg_values_supported: ['RS256'],
}

// Fake user stored in sessionStorage. The id_token does not need to be a
// real JWT because oidc-client-ts reads profile data directly from the stored
// JSON object without re-validating the token signature.
const MOCK_USER = {
  id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.FAKE.FAKE',
  access_token: 'mock-access-token',
  token_type: 'Bearer',
  scope: 'openid profile email',
  profile: {
    sub: 'test-user-123',
    name: 'Test Admin',
    email: 'admin@test.com',
    iss: KEYCLOAK_BASE,
    aud: KEYCLOAK_CLIENT_ID,
    iat: 1000000000,
    exp: 9999999999,
  },
  expires_at: 9999999999,
}

describe('Admin Portal Authentication', () => {
  beforeEach(() => {
    cy.intercept('GET', '/config.json', {
      keycloakUrl: 'http://localhost:8080',
      keycloakRealm: 'showcase',
      keycloakClientId: 'showcase-admin',
    })
    cy.intercept('GET', `${KEYCLOAK_BASE}/.well-known/openid-configuration`, MOCK_OIDC_DISCOVERY)
    cy.intercept('GET', `${KEYCLOAK_BASE}/protocol/openid-connect/certs`, { keys: [] })
  })

  it('shows the login page with the Admin Log In button', () => {
    cy.visit(ADMIN_PATH)
    cy.contains('BC Wallet Showcase').should('be.visible')
    cy.contains('button', 'Admin Log In').should('be.visible')
  })

  it('redirects unauthenticated users away from the creator page', () => {
    cy.visit(CREATOR_PATH)
    cy.url().should('not.include', '/creator')
    cy.contains('button', 'Admin Log In').should('be.visible')
  })

  it('shows a signed out message when the signedOut query param is present', () => {
    cy.visit(`${ADMIN_PATH}?signedOut=true`)
    cy.contains('You have been successfully signed out.').should('be.visible')
    cy.contains('button', 'Admin Log In').should('be.visible')
  })

  describe('when authenticated', () => {
    beforeEach(() => {
      cy.visit(CREATOR_PATH, {
        onBeforeLoad(win) {
          // keycloakConfig.ts assigns __oidcMemStore (an InMemoryWebStorage instance)
          // on the window in non-production. We intercept that assignment with a setter
          // so the mock user is seeded atomically when the module runs, before
          // AuthProvider reads the store.
          Object.defineProperty(win, '__oidcMemStore', {
            configurable: true,
            set(store: { setItem(k: string, v: string): void }) {
              store.setItem(SESSION_KEY, JSON.stringify(MOCK_USER))
              Object.defineProperty(win, '__oidcMemStore', { value: store, configurable: true, writable: true })
            },
          })
        },
      })
    })

    it('shows the creator page with a welcome message', () => {
      cy.contains('h1', 'Admin Portal').should('be.visible')
      cy.contains('Welcome, Test Admin').should('be.visible')
    })

    it('shows a sign out button', () => {
      cy.contains('button', 'Sign Out').should('be.visible')
    })

    it('returns to the login page with a signed out message after signing out', () => {
      cy.intercept('GET', `${KEYCLOAK_BASE}/protocol/openid-connect/logout*`, (req) => {
        const url = new URL(req.url)
        const redirectUri =
          url.searchParams.get('post_logout_redirect_uri') ?? `http://localhost:3000${ADMIN_PATH}?signedOut=true`
        req.reply({ statusCode: 302, headers: { location: redirectUri } })
      })

      cy.contains('button', 'Sign Out').click()
      cy.url().should('include', `${ADMIN_PATH}?signedOut=true`)
      cy.contains('You have been successfully signed out.').should('be.visible')
    })
  })
})
