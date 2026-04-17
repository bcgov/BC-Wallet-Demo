import mongoose from 'mongoose'

import logger from '../utils/logger'

import { getMongoUri } from './uri'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function connectDB(): Promise<void> {
  const uri = getMongoUri()
  const sanitizedUri = uri.replace(/\/\/.*@/, '//<credentials>@')
  const maxAttempts = 3
  const initialBackoffMs = 500

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 })
      logger.info({ uri: sanitizedUri }, 'Connected to MongoDB')
      return
    } catch (error) {
      if (attempt === maxAttempts) {
        logger.error(
          { attempt, maxAttempts, uri: sanitizedUri, err: error },
          'Failed to connect to MongoDB after maximum retry attempts'
        )
        throw error
      }

      const backoffMs = initialBackoffMs * 2 ** (attempt - 1)
      logger.warn(
        { attempt, maxAttempts, backoffMs, uri: sanitizedUri, err: error },
        'MongoDB connection attempt failed; retrying'
      )
      await delay(backoffMs)
    }
  }
}

type DisconnectFn = () => Promise<void>
type OnceFn = (event: string, listener: () => void) => NodeJS.EventEmitter

export function registerShutdownHandlers(
  disconnectFn: DisconnectFn = () => mongoose.disconnect(),
  once: OnceFn = process.once.bind(process)
): void {
  const disconnect = async (signal: string) => {
    logger.info({ signal }, 'Disconnecting from MongoDB')
    await disconnectFn()
    process.exit(0)
  }

  for (const signal of ['SIGTERM', 'SIGINT']) {
    once(signal, () => {
      void disconnect(signal).catch((error: unknown) => {
        logger.error({ signal, error }, 'Failed to disconnect from MongoDB')
        process.exit(1)
      })
    })
  }
}
