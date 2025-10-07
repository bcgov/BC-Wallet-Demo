import { Request, Response } from 'express'
import {
  ExpressErrorMiddlewareInterface,
  HttpError,
  Middleware,
  NotFoundError,
  UnauthorizedError,
} from 'routing-controllers'
import { Service } from 'typedi'

import { createRequestLogger } from '../utils/logger'

@Service()
@Middleware({ type: 'after' })
export class ExpressErrorHandler implements ExpressErrorMiddlewareInterface {
  private readonly logger = createRequestLogger('ExpressErrorHandler')

  error(error: HttpError | UnauthorizedError, request: Request, response: Response): void {
    const requestContext = {
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
    }

    if (error instanceof NotFoundError) {
      this.logger.warn({ error: error.message, ...requestContext }, 'Resource not found')
      response.status(404).json({
        message: error.message ?? 'Not Found',
      })
    } else if (error instanceof UnauthorizedError) {
      this.logger.warn({ error: error.message, ...requestContext }, 'Unauthorized access attempt')
      response.status(401).json({
        message: error.message ?? 'Unauthorized',
      })
    } else {
      this.logger.error(
        { 
          error: error.message, 
          stack: error.stack, 
          httpCode: error.httpCode,
          ...requestContext 
        }, 
        'Internal server error'
      )
      response.status(error.httpCode || 500).json({
        message: error.message ?? 'Internal server error',
      })
    }
  }
}
