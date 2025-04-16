import { HttpError } from 'routing-controllers'

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(400, message)
  }
}
