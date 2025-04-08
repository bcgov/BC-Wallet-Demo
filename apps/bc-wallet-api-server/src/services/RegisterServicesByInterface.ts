import Container from 'typedi'
import { OidcSessionService } from './OidcSessionService'

export async function registerServicesByInterface() {
  const oidcSessionService = Container.get(OidcSessionService)
  Container.set('ISessionService', oidcSessionService)
}
