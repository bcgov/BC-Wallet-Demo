import mongoose from 'mongoose'

import logger from '../utils/logger'

import { getMongoUri } from './uri'

export async function connectDB(): Promise<void> {
  const uri = getMongoUri()
  await mongoose.connect(uri)
  logger.info({ uri: uri.replace(/\/\/.*@/, '//<credentials>@') }, 'Connected to MongoDB')
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
