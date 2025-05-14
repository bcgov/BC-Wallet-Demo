import { SendOptions } from 'bc-wallet-adapter-client-api'

import type { ISessionService } from '../types/services/session'

export abstract class AbstractAdapterClientService {
  protected constructor(protected readonly sessionService: ISessionService) {}

  protected buildSendOptions(): SendOptions {
    const tenant = this.sessionService.getCurrentTenant()
    if (!tenant) {
      throw new Error('Current tenant not set')
    }
    return {
      authHeader: this.sessionService.getBearerToken()?.getRawToken(),
      showcaseApiUrlBase: `${this.sessionService.getApiBaseUrl()}/${tenant.id}`,
      ...(tenant.tractionApiUrl && { tractionApiUrlBase: tenant.tractionApiUrl }),
      ...(tenant.tractionTenantId && { tractionTenantId: tenant.tractionTenantId }),
      ...(tenant.tractionWalletId && { tractionWalletId: tenant.tractionWalletId }),
    }
  }
}
