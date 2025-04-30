import { AdapterClientApi } from 'bc-wallet-adapter-client-api'
import Container from 'typedi'

import { OidcSessionService } from './OidcSessionService'

export async function registerServicesByInterface() {
  const oidcSessionService = Container.get(OidcSessionService)
  Container.set('ISessionService', oidcSessionService)
  const adapterClientApi = Container.get(AdapterClientApi)
  Container.set('IAdapterClientApi', adapterClientApi)
}
