import type { Buffer } from 'buffer'
import { LRUCache } from 'lru-cache'

import { environment } from '../environment'
import { decryptBufferAsString } from '../util/CypherUtil'
import { ShowcaseApiService } from './showcase-api-service'
import { UpdatedTokens, TractionService } from './traction-service'

class ServiceManager {
  private readonly services = new LRUCache<string, TractionService | ShowcaseApiService>({
    max: environment.traction.TENANT_SESSION_CACHE_SIZE,
    ttl: environment.traction.TENANT_SESSION_TTL_MINS * 60,
  })

  public async getTractionService(
    tenantId: string,
    showcaseApiUrlBase: string,
    tractionApiUrlBase: string,
    walletId?: string,
    accessTokenEnc?: Buffer,
    accessTokenNonce?: Buffer,
  ): Promise<TractionService> {
    const key = this.buildKey(tractionApiUrlBase, showcaseApiUrlBase, tenantId, walletId)
    const decodedToken = this.decodeToken(accessTokenEnc, accessTokenNonce)
    const updatedTokens: UpdatedTokens = {
      showcaseApiToken: decodedToken,
    }

    // Return existing service if it exists
    if (this.services.has(key)) {
      const service = this.services.get(key)! as TractionService

      // Update token if provided
      /*if (decodedToken) {  TODO as long as we cannot get Traction to accept the user's bearer token we need to create one here
        service.updateBearerToken(decodedToken)
      } else if (!service.hasBearerToken() && environment.traction.FIXED_API_KEY) {
        service.updateBearerToken(await service.getTenantToken(environment.traction.FIXED_API_KEY))
      }*/
      // -> Alternative logic
      if (!(await service.hasBearerToken()) && environment.traction.FIXED_API_KEY) {
        const freshTractionToken = await service.getTenantToken(environment.traction.FIXED_API_KEY)
        updatedTokens.tractionToken = freshTractionToken
      }
      service.updateBearerTokens(updatedTokens)
      return service
    }

    const showcaseApiService = new ShowcaseApiService(showcaseApiUrlBase)
    const tractionService = new TractionService(tenantId, tractionApiUrlBase, showcaseApiService, walletId)
    /*
    if (!decodedToken && environment.traction.FIXED_API_KEY) { TODO as long as we cannot get Traction to accept the user's bearer token we need to create one here
      tractionService.updateBearerToken(await tractionService.getTenantToken(environment.traction.FIXED_API_KEY))
    }
*/
    // -> Alternative logic
    if (environment.traction.FIXED_API_KEY) {
      const freshTractionToken = await tractionService.getTenantToken(environment.traction.FIXED_API_KEY)
      updatedTokens.tractionToken = freshTractionToken
    }
    tractionService.updateBearerTokens(updatedTokens)
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
    tractionApiUrlBase: string,
    showcaseApiUrlBase: string,
    tenantId: string,
    walletId?: string,
  ): string {
    const tractionHash = this.simpleHashString(tractionApiUrlBase)
    const showcaseHash = this.simpleHashString(showcaseApiUrlBase)
    return walletId
      ? `${tractionHash}:${showcaseHash}:${tenantId}:${walletId}`
      : `${tractionHash}:${showcaseHash}:${tenantId}`
  }

  private simpleHashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    // Convert to base36
    return Math.abs(hash).toString(36)
  }
}

// Singleton instance
const serviceRegistry = new ServiceManager()

export async function getTractionService(
  tenantId: string,
  showcaseApiUrlBase: string,
  tractionApiUrlBase: string,
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
