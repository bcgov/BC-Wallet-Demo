import Container from 'typedi'
import { OidcSessionService } from './OidcSessionService'

export function registerServicesByInterface() {
  Container.set('ISessionService', new OidcSessionService())
}
