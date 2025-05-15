import { Response } from 'express'
import {
  ExpressErrorMiddlewareInterface,
  HttpError,
  Middleware,
  NotFoundError,
  UnauthorizedError,
} from 'routing-controllers'
import { Service } from 'typedi'

@Service()
@Middleware({ type: 'after' })
export class ExpressErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: HttpError | UnauthorizedError, request: Request, response: Response): void {
    if (error instanceof NotFoundError) {
      response.status(404).json({
        message: error.message ?? 'Not Found',
      })
    } else if (error instanceof UnauthorizedError) {
      response.status(401).json({
        message: error.message ?? 'Unauthorized',
      })
    } else {
      response.status(500).json({
        message: error.message ?? 'Internal server error',
      })
    }
  }
}
