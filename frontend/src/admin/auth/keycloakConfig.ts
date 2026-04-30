import type { AuthProviderProps } from 'react-oidc-context'

import { Log, WebStorageStateStore } from 'oidc-client-ts'

import { adminBaseRoute } from '../api/adminApi'

if (import.meta.env.DEV) {
  Log.setLogger(console)
  Log.setLevel(Log.DEBUG)
}

interface AppConfig {
  keycloakUrl: string
  keycloakRealm: string
  keycloakClientId: string
}

export async function loadOidcConfig(): Promise<AuthProviderProps> {
  const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/config.json`)
  if (!res.ok) throw new Error(`Failed to load /config.json: ${res.status}`)
  const { keycloakUrl, keycloakRealm, keycloakClientId } = (await res.json()) as AppConfig

  return {
    authority: `${keycloakUrl}/realms/${keycloakRealm}`,
    client_id: keycloakClientId,
    redirect_uri: `${window.location.origin}${adminBaseRoute}/callback`,
    post_logout_redirect_uri: `${window.location.origin}${adminBaseRoute}`,
    scope: 'openid profile email',
    automaticSilentRenew: true,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  }
}
