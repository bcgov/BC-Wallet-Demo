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
  }

  process.once('SIGTERM', () => disconnect('SIGTERM'))
  process.once('SIGINT', () => disconnect('SIGINT'))
}
