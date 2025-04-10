import type { ConnectionOptions } from 'rhea-promise'

import { Topic } from './types/adapter-backend'

const createAmqConnectionOptions = (transport?: string): ConnectionOptions => {
  // Default to 'tls' if not provided or invalid
  const validTransport = transport === 'tcp' || transport === 'tls' || transport === 'ssl' ? transport : 'tls'

  // Base connection options
  const options = {
    hostname: process.env.AMQ_HOST || 'localhost',
    port: parseInt(process.env.AMQ_PORT || '5672', 10),
    reconnect: true,
    username: process.env.AMQ_USER || 'guest',
    password: process.env.AMQ_PASSWORD || 'guest',
  }

  // Add transport property with correct type
  if (validTransport === 'tcp') {
    return {
      ...options,
      transport: 'tcp',
    }
  } else {
    return {
      ...options,
      transport: validTransport as 'tls' | 'ssl',
    }
  }
}

const validateTopic = (topic?: string): Topic | undefined => {
  if (!topic) {
    return undefined
  }
  if (!Object.values(Topic).includes(topic as Topic)) {
    throw new Error(`Invalid topic: ${topic}. Valid topics are: ${Object.values(Topic).join(', ')}`)
  }
  return topic as Topic
}

const parsePositiveInt = (value: string | undefined, defaultValue: number): number => {
  if (!value) {
    return defaultValue
  }

  const parsed = parseInt(value, 10)

  if (isNaN(parsed) || parsed <= 0) {
    return defaultValue
  }

  return parsed
}

console.log('env:', process.env)

export const environment = {
  messageBroker: {
    AMQ_HOST: process.env.AMQ_HOST || 'bc-wallet-rabbitmq.default.svc.cluster.local',
    AMQ_PORT: parsePositiveInt(process.env.AMQ_PORT, 5672),
    AMQ_USER: process.env.AMQ_USER || 'guest',
    AMQ_PASSWORD: process.env.AMQ_PASSWORD || 'guest',
    AMQ_TRANSPORT:
      process.env.AMQ_TRANSPORT === 'tcp' || process.env.AMQ_TRANSPORT === 'tls' || process.env.AMQ_TRANSPORT === 'ssl'
        ? process.env.AMQ_TRANSPORT
        : 'tls',
    getConnectionOptions: () => createAmqConnectionOptions(process.env.AMQ_TRANSPORT),
    MESSAGE_PROCESSOR_TOPIC: validateTopic(process.env.MESSAGE_PROCESSOR_TOPIC) ?? Topic.SHOWCASE_CMD,
  },
  encryption: {
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
    KEY_SIZE: parsePositiveInt(process.env.ENCRYPTION_KEY_SIZE, 32), // 256 bits
    NONCE_SIZE: parsePositiveInt(process.env.ENCRYPTION_NONCE_SIZE, 12), // 96 bits for ChaCha20-Poly1305
    AUTH_TAG_LENGTH: 16, // 128 bits, fixed for ChaCha20-Poly1305
  },
}
