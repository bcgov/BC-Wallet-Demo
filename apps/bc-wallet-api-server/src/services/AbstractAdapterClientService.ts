import { SendOptions } from 'bc-wallet-adapter-client-api'

import type { ISessionService } from '../types/services/session'

export abstract class AbstractAdapterClientService {
  protected constructor(protected readonly sessionService: ISessionService) {}

  protected buildSendOptions(): SendOptions {
    return {
      authHeader: this.sessionService.getBearerToken(),
      showcaseApiUrlBase: this.sessionService.getApiBaseUrl(),
    }
  }
}
