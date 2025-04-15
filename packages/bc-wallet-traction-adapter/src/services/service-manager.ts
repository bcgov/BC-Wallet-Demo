import type { Buffer } from 'buffer'
import { LRUCache } from 'lru-cache'

import { environment } from '../environment'
import { decryptBufferAsString } from '../util/CypherUtil'
import { ShowcaseApiService } from './showcase-api-service'
import { TractionService } from './traction-service'

class ServiceManager {
  private readonly services = new LRUCache<string, TractionService | ShowcaseApiService>({
    max: environment.traction.TENANT_SESSION_CACHE_SIZE,
    ttl: environment.traction.TENANT_SESSION_TTL_MINS * 60,
  })

  public async getTractionService(
    tenantId: string,
    showcaseApiUrlBase: string,
    tractionApiUrlBase?: string,
    walletId?: string,
    accessTokenEnc?: Buffer,
    accessTokenNonce?: Buffer,
  ): Promise<TractionService> {
    const key = this.buildKey(tractionApiUrlBase, tenantId, walletId)
    const decodedToken = this.decodeToken(accessTokenEnc, accessTokenNonce)

    // Return existing service if it exists
    if (this.services.has(key)) {
      const service = this.services.get(key)! as TractionService

      // Update token if provided
      if (decodedToken) {
        service.updateBearerToken(decodedToken)
      } else if (!service.hasBearerToken() && environment.traction.FIXED_API_KEY) {
        service.updateBearerToken(await service.getTenantToken(environment.traction.FIXED_API_KEY))
      }
      return service
    }

    const showcaseApiService = new ShowcaseApiService(showcaseApiUrlBase)
    const tractionService = new TractionService(
      tenantId,
      tractionApiUrlBase,
      showcaseApiService,
      walletId,
      decodedToken,
    )
    if (!decodedToken && environment.traction.FIXED_API_KEY) {
      tractionService.updateBearerToken(await tractionService.getTenantToken(environment.traction.FIXED_API_KEY))
    }

    this.services.set(key, tractionService)
    return tractionService
  }

  private decodeToken(accessTokenEnc?: Buffer, accessTokenNonce?: Buffer) {
    let decodedToken: string | undefined
    if (accessTokenEnc && accessTokenEnc.length > 0) {
      if (accessTokenNonce && accessTokenNonce.length > 0) {
        decodedToken = decryptBufferAsString(accessTokenEnc, accessTokenNonce)
      } else {
        throw Error('An access token was provided without a nonce')
      }
    }
    return decodedToken
  }

  private buildKey(
    apiUrlBase: string = environment.traction.DEFAULT_API_BASE_PATH,
    tenantId: string,
    walletId?: string,
  ): string {
    return walletId ? `${apiUrlBase}:${tenantId}:${walletId}` : `${apiUrlBase}:${tenantId}`
  }
}

// Singleton instance
const serviceRegistry = new ServiceManager()

export async function getTractionService(
  tenantId: string,
  showcaseApiUrlBase: string,
  tractionApiUrlBase?: string,
  walletId?: string,
  accessTokenEnc?: Buffer,
  accessTokenNonce?: Buffer,
): Promise<TractionService> {
  if (!tenantId) {
    throw new Error('tenantId is required')
  }

  return await serviceRegistry.getTractionService(
    tenantId,
    showcaseApiUrlBase,
    tractionApiUrlBase,
    walletId,
    accessTokenEnc,
    accessTokenNonce,
  )
}
