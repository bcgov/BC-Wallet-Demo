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
      await mongoose.connect(uri)
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

export function registerShutdownHandlers(): void {
  const disconnect = async (signal: string) => {
    logger.info({ signal }, 'Disconnecting from MongoDB')
    await mongoose.disconnect()
    process.exit(0)
  }

  process.once('SIGTERM', () => {
    void disconnect('SIGTERM').catch((error: unknown) => {
      logger.error({ signal: 'SIGTERM', error }, 'Failed to disconnect from MongoDB')
      process.exit(1)
    })
  })
  process.once('SIGINT', () => {
    void disconnect('SIGINT').catch((error: unknown) => {
      logger.error({ signal: 'SIGINT', error }, 'Failed to disconnect from MongoDB')
      process.exit(1)
    })
  })
}
