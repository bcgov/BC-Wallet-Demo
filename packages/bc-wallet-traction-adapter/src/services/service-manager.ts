import { TractionService } from './traction-service'
import { environment } from '../environment'
import { LRUCache } from 'lru-cache'
import { decryptBufferAsString } from '../util/CypherUtil'
import { Buffer } from 'buffer'

class ServiceManager {
  private readonly services = new LRUCache<string, TractionService>({
    max: environment.traction.TENANT_SESSION_CACHE_SIZE,
    ttl: environment.traction.TENANT_SESSION_TTL_MINS * 60,
  })

  public getTractionService(
    tenantId: string,
    apiUrlBase?: string,
    walletId?: string,
    accessTokenEnc?: Buffer,
    accessTokenNonce?: Buffer,
  ): TractionService {
    const key = this.buildKey(apiUrlBase, tenantId, walletId)
    const decodedToken = this.decodeToken(accessTokenEnc, accessTokenNonce)

    // Return existing service if it exists
    if (this.services.has(key)) {
      const service = this.services.get(key)!

      // Update token if provided
      if (decodedToken) {
        service.updateBearerToken(decodedToken)
      }

      return service
    }

    const service = new TractionService(tenantId, apiUrlBase, walletId, decodedToken)

    this.services.set(key, service)
    return service
  }

  private decodeToken(accessTokenEnc?: Buffer, accessTokenNonce?: Buffer) {
    let decodedToken: string | undefined
    if (accessTokenEnc) {
      if (accessTokenNonce) {
        decodedToken = decryptBufferAsString(accessTokenEnc, accessTokenNonce)
      } else {
        throw Error('An access token was provided without a nonce')
      }
    }
    return decodedToken
  }

  private buildKey(apiUrlBase: string = environment.traction.DEFAULT_API_BASE_PATH, tenantId: string, walletId?: string): string {
    return walletId ? `${apiUrlBase}:${tenantId}:${walletId}` : `${apiUrlBase}:${tenantId}`
  }
}

// Singleton instance
const serviceRegistry = new ServiceManager()

export function getTractionService(
  tenantId: string,
  apiUrlBase?: string,
  walletId?: string,
  accessTokenEnc?: Buffer,
  accessTokenNonce?: Buffer,
): TractionService {
  if (!tenantId) {
    throw new Error('tenantId is required')
  }

  return serviceRegistry.getTractionService(tenantId, apiUrlBase, walletId, accessTokenEnc, accessTokenNonce)
}
