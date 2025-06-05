import { ResponseError } from 'bc-wallet-traction-openapi'

import { DEBUG_ENABLED } from '../environment'
import { buildHttpErrorMessage } from './http-error'

// Retry configuration
const MAX_RETRIES = 6
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30000

/**
 * Checks if an error is retryable based on timeout keywords in the response
 */
async function isRetryableError(error: unknown): Promise<boolean> {
  if (!(error instanceof ResponseError)) {
    return false
  }

  try {
    const errorMessage = await buildHttpErrorMessage(error.response)
    const timeoutKeywords = ['timeout', 'pool timeout', 'request was interrupted', 'connection timeout']
    return timeoutKeywords.some((keyword) => errorMessage.toLowerCase().includes(keyword.toLowerCase()))
  } catch {
    return false
  }
}

/**
 * Implements exponential backoff with jitter
 */
function calculateDelay(attempt: number): number {
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS)
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1)
  return Math.floor(delay + jitter)
}

/**
 * Generic retry wrapper for API calls that may experience timeout errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt === maxRetries) {
        break
      }

      const isRetryable = await isRetryableError(error)
      if (!isRetryable) {
        throw error
      }

      const delay = calculateDelay(attempt)
      if (DEBUG_ENABLED) {
        console.debug(`${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
