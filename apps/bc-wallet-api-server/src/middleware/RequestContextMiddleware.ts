import { NextFunction, Request, Response } from 'express'
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers'
import { Inject, Service } from 'typedi'

import { Token } from '../types/auth/token'
import { ISessionServiceUpdater } from '../types/services/session'

@Service()
@Middleware({ type: 'before' })
export class RequestContextMiddleware implements ExpressMiddlewareInterface {
  public constructor(@Inject('ISessionService') private readonly sessionService: ISessionServiceUpdater) {}

  public use(request: Request, _: Response, next: NextFunction): void {
    const authHeader = request.headers['authorization']
    const apiBaseUrl = this.buildApiBaseUrl(request)
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    const token = bearerToken ? new Token(bearerToken) : undefined
    this.sessionService.setRequestDetails(apiBaseUrl, token)

    next()
  }

  private buildApiBaseUrl(request: Request): string {
    const protocol = request.headers['x-forwarded-proto']?.toString() ?? request.protocol
    let host = request.headers['x-forwarded-host']?.toString() ?? request.get('host')
    const forwardedPort = request.headers['x-forwarded-port']?.toString()
    const forwardedPrefix = request.headers['x-forwarded-prefix']?.toString() ?? ''

    if (!host) {
      throw new Error('Host header is missing')
    }

    if (forwardedPort) {
      let baseHost: string

      // Strip any existing port from the host value
      // Handle IPv6 address format like [::1]:8080
      if (host.startsWith('[')) {
        const closingBracketIndex = host.indexOf(']')
        baseHost = closingBracketIndex !== -1 ? host.substring(0, closingBracketIndex + 1) : host
      } else {
        // Handle IPv4 or hostname format like localhost:8080 by taking the part before the first colon
        baseHost = host.split(':')[0]
      }
      const isDefaultForProtocol =
        (protocol === 'https' && forwardedPort === '443') || (protocol === 'http' && forwardedPort === '80')

      host = isDefaultForProtocol ? baseHost : `${baseHost}:${forwardedPort}`
    }

    return `${protocol}://${host}${forwardedPrefix}`
  }
}
