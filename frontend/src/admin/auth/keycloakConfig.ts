import type { AuthProviderProps } from 'react-oidc-context'

import { InMemoryWebStorage, Log, WebStorageStateStore } from 'oidc-client-ts'

import { baseRoute } from '../../client/api/BaseUrl'

if (process.env.NODE_ENV !== 'production') {
  Log.setLogger(console)
  Log.setLevel(Log.DEBUG)
}

interface AppConfig {
  keycloakUrl: string
  keycloakRealm: string
  keycloakClientId: string
}

export const memStore = new InMemoryWebStorage()

// Expose the store on the window in non-production so Cypress E2E tests
// can pre-seed auth state via the __oidcMemStore property.
if (process.env.NODE_ENV !== 'production') {
  ;(window as Window & { __oidcMemStore?: InMemoryWebStorage }).__oidcMemStore = memStore
}

export async function loadOidcConfig(): Promise<AuthProviderProps> {
  const res = await fetch(`${process.env.PUBLIC_URL ?? ''}/config.json`)
  if (!res.ok) throw new Error(`Failed to load /config.json: ${res.status}`)
  const { keycloakUrl, keycloakRealm, keycloakClientId } = (await res.json()) as AppConfig

  return {
    authority: `${keycloakUrl}/realms/${keycloakRealm}`,
    client_id: keycloakClientId,
    redirect_uri: `${window.location.origin}${baseRoute}/admin/callback`,
    post_logout_redirect_uri: `${window.location.origin}${baseRoute}/admin`,
    scope: 'openid profile email',
    automaticSilentRenew: true,
    userStore: new WebStorageStateStore({ store: memStore }),
  }
}
