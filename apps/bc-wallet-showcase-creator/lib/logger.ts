import type { LogEvent } from 'pino'
import { pino, type Logger } from 'pino'

/**
 * Application configuration object
 * @property {string} serverUrl - URL for the API server, defaults to localhost:3000
 * @property {string} env - Current environment (development, production, test)
 * @property {string} publicUrl - Base URL for public assets
 */
const config = {
  serverUrl: process.env.REACT_APP_API_PATH || 'http://localhost:3000',
  env: process.env.NODE_ENV,
  publicUrl: process.env.PUBLIC_URL,
}

/**
 * Main logger instance configured with pretty printing and browser transport
 * @property {Object} transport - Configuration for pino-pretty formatting
 * @property {string} level - Minimum log level, defaults to "info"
 * @property {string[]} redact - Fields to be redacted from logs
 * @property {Object} browser - Browser-specific configuration
 */
const logger: Logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
  level: process.env.PINO_LOG_LEVEL || 'info',
  redact: [], // prevent logging of sensitive data
  browser: {
    asObject: true,
    serialize: true,
    transmit: {
      level: 'info',
      /**
       * Sends log events to the server using navigator.sendBeacon
       * @param {string} _level - Log level (unused parameter)
       * @param {LogEvent} logEvent - The log event to be transmitted
       */
      send: (_level: string, logEvent: LogEvent) => {
        if (typeof window !== 'undefined') {
          const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
            type: 'application/json',
          }
          const blob = new Blob(
            [
              JSON.stringify({
                ctx: logEvent.bindings[0] ? logEvent.bindings[0] : undefined,
                data: logEvent.messages,
                level: logEvent.level.label,
                value: logEvent.level.value,
              }),
            ],
            headers
          )
          if (config.serverUrl) {
            navigator.sendBeacon(`${config.serverUrl}/log`, blob)
          }
        }
      },
    },
  },
})

/**
 * Creates a new logger instance with additional context
 * @param {string} context - Context identifier for the logger
 * @example
 * const credentialsLogger = createContextLogger('credentials');
 * credentialsLogger.info('Credentials has been created'); // Logs with 'credentials' context
 */
export const createContextLogger = (context: string) => {
  return logger.child({ context })
}

/**
 * Pre-configured logger for store-related operations
 */
export const storeLogger = createContextLogger('store')

/**
 * Pre-configured logger for credential-related operations
 */
export const credentialsLogger = createContextLogger('credentials')

export interface LogContext {
  action?: string
  details?: Record<string, unknown>
  error?: Error
}

/**
 * Formats log context information into a consistent structure
 * @param {LogContext} { action, details, error } - The log context object
 * @returns {Object} Formatted log context
 * @example
 * const context = formatLogContext({
 *   action: 'userLogin',
 *   details: { userId: '123' },
 *   error: new Error('Login failed')
 * });
 */
export const formatLogContext = ({ action, details, error }: LogContext) => {
  return {
    ...(action && { action }),
    ...(details && { details }),
    ...(error && {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    }),
  }
}

/**
 * Shorthand method for logging info messages
 * @param {string} msg - Message to log
 * @example
 * log('Application started');
 */
export const log = (msg: string) => logger.info(msg)

export default logger
