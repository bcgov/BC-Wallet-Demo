import { NextFunction, Request, Response } from 'express'
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers'
import { Inject, Service } from 'typedi'

import { ISessionServiceUpdater } from '../types/services/session'

@Service()
@Middleware({ type: 'before' })
export class RequestContextMiddleware implements ExpressMiddlewareInterface {
  public constructor(@Inject('ISessionService') private readonly sessionService: ISessionServiceUpdater) {}

  public use(request: Request, _: Response, next: NextFunction): void {
    const authHeader = request.headers['authorization']
    const apiBaseUrl = this.buildApiBaseUrl(request)
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    this.sessionService.setRequestDetails(apiBaseUrl, token)

    next()
  }

  private buildApiBaseUrl(request: Request): string {
    const protocol = request.headers['x-forwarded-proto']?.toString() ?? request.protocol
    let host = request.headers['x-forwarded-host']?.toString() ?? request.get('host')
    const forwardedPort = request.headers['x-forwarded-port']?.toString()

    if (
      forwardedPort &&
      !(protocol === 'https' && forwardedPort === '443') &&
      !(protocol === 'http' && forwardedPort === '80')
    ) {
      host += `:${forwardedPort}`
    }

    const forwardedPrefix = request.headers['x-forwarded-prefix']?.toString() ?? ''

    return `${protocol}://${host}${forwardedPrefix}`
  }
}
