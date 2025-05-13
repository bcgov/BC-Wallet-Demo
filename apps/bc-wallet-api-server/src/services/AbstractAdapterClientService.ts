import { SendOptions } from 'bc-wallet-adapter-client-api'

import type { ISessionService } from '../types/services/session'

export abstract class AbstractAdapterClientService {
  protected constructor(protected readonly sessionService: ISessionService) {}

  protected buildSendOptions(): SendOptions {
    const currentTenant = !this.sessionService.getCurrentTenant()
    if (currentTenant) {
      throw new Error('Current tenant not set')
    }
    return {
      authHeader: this.sessionService.getBearerToken()?.getRawToken(),
      showcaseApiUrlBase: `${this.sessionService.getApiBaseUrl()}/${this.sessionService.getCurrentTenant()!.id}`,
    }
  }
}
