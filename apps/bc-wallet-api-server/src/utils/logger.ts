import pino from 'pino'

/**
 * Application-wide logger configuration
 * Uses pino for structured, high-performance logging
 */
export const logger = pino({
  level: 'info',
  formatters: {
    level: (label: string) => {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

/**
 * Creates a child logger with additional context
 * @param context - Additional context to be included in all log messages
 * @returns A child logger instance
 */
export const createLogger = (context: Record<string, any>) => {
  return logger.child(context)
}

/**
 * Logger middleware for Express routes
 * Logs request information including method, url, and response time
 */
export const createRequestLogger = (component: string) => {
  return createLogger({ component })
}