import type { AuthProviderProps } from 'react-oidc-context'

import { InMemoryWebStorage, Log, WebStorageStateStore } from 'oidc-client-ts'

import { baseRoute } from '../../client/api/BaseUrl'

if (process.env.NODE_ENV !== 'production') {
  Log.setLogger(console)
  Log.setLevel(Log.DEBUG)
}

const keycloakUrl = process.env.REACT_APP_KEYCLOAK_URL ?? 'http://localhost:8080'
const keycloakRealm = process.env.REACT_APP_KEYCLOAK_REALM ?? 'showcase'
const keycloakClientId = process.env.REACT_APP_KEYCLOAK_CLIENT_ID ?? 'showcase-admin'

export const oidcConfig: AuthProviderProps = {
  authority: `${keycloakUrl}/realms/${keycloakRealm}`,
  client_id: keycloakClientId,
  redirect_uri: `${window.location.origin}${baseRoute}/admin/callback`,
  post_logout_redirect_uri: `${window.location.origin}${baseRoute}/admin`,
  scope: 'openid profile email',
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
}
