import { SendOptions } from 'bc-wallet-adapter-client-api'

import type { ISessionService } from '../types/services/session'
import TenantService from './TenantService'

export abstract class AbstractAdapterClientService {
  protected constructor(
    protected readonly sessionService: ISessionService,
    private readonly tenantService: TenantService,
  ) {}

  protected async buildSendOptions(): Promise<SendOptions> {
    const tenant = this.sessionService.getCurrentTenant()
    if (!tenant) {
      throw new Error('Current tenant not set')
    }
    const fullTenant = await this.tenantService.getTenant(tenant.id) // User's tenant record is redacted and does not contain Traction secrets

    return {
      authHeader: this.sessionService.getBearerToken()?.getRawToken(),
      showcaseApiUrlBase: `${this.sessionService.getApiBaseUrl()}/${fullTenant.id}`,
      ...(fullTenant.tractionApiUrl && { tractionApiUrlBase: fullTenant.tractionApiUrl }),
      ...(fullTenant.tractionTenantId && { tractionTenantId: fullTenant.tractionTenantId }),
      ...(fullTenant.tractionWalletId && { tractionWalletId: fullTenant.tractionWalletId }),
    }
  }
}
