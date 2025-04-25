import type { ConnectionOptions } from 'rhea-promise'

import { Topic, TOPICS } from './types'

const createAmqConnectionOptions = (transport?: string): ConnectionOptions => {
  // Default to 'tls' if not provided or invalid
  const validTransport = transport === 'tcp' || transport === 'tls' || transport === 'ssl' ? transport : 'tls'

  // Base connection options
  const options = {
    host: process.env.AMQ_HOST || 'localhost',
    port: parseInt(process.env.AMQ_PORT || '5672', 10),
    reconnect: true,
    username: process.env.AMQ_USER || 'guest',
    password: process.env.AMQ_PASSWORD || 'guest',
  } satisfies ConnectionOptions

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

export function validateTopic(topic?: string): Topic | undefined {
  if (!topic) {
    return undefined
  }
  if (!TOPICS.includes(topic as Topic)) {
    throw new Error(`Invalid topic: ${topic}. Valid topics are: ${TOPICS.join(', ')}`)
  }
  return topic as Topic
}

console.debug('traction-adapter env:', process.env)

export const environment = {
  messageBroker: {
    AMQ_HOST: process.env.AMQ_HOST || 'localhost',
    AMQ_PORT: parseInt(process.env.AMQ_PORT || '5672', 10),
    AMQ_USER: process.env.AMQ_USER || 'guest',
    AMQ_PASSWORD: process.env.AMQ_PASSWORD || 'guest',
    AMQ_TRANSPORT:
      process.env.AMQ_TRANSPORT === 'tcp' || process.env.AMQ_TRANSPORT === 'tls' || process.env.AMQ_TRANSPORT === 'ssl'
        ? process.env.AMQ_TRANSPORT
        : 'tls',
    getConnectionOptions: () => createAmqConnectionOptions(process.env.AMQ_TRANSPORT),
    MESSAGE_PROCESSOR_TOPIC: validateTopic(process.env.MESSAGE_PROCESSOR_TOPIC) ?? 'showcase-cmd',
  },
  traction: {
    DEFAULT_API_BASE_PATH: process.env.DEFAULT_API_BASE_PATH ?? 'http://localhost:8032',
    TENANT_SESSION_CACHE_SIZE: parsePositiveInt(process.env.TENANT_SESSION_CACHE_SIZE, 1024),
    TENANT_SESSION_TTL_MINS: parsePositiveInt(process.env.TENANT_SESSION_TTL_MINS, 1440),
    FIXED_TENANT_ID: process.env.FIXED_TENANT_ID as string | undefined,
    FIXED_WALLET_ID: process.env.FIXED_WALLET_ID as string | undefined,
    FIXED_API_KEY: process.env.FIXED_API_KEY as string | undefined,
  },
  showcase: {
    DEFAULT_SHOWCASE_API_BASE_PATH: process.env.DEFAULT_SHOWCASE_API_BASE_PATH ?? 'http://localhost:5003',
  },
  encryption: {
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
    KEY_SIZE: parsePositiveInt(process.env.ENCRYPTION_KEY_SIZE, 32), // 256 bits
    NONCE_SIZE: parsePositiveInt(process.env.ENCRYPTION_NONCE_SIZE, 12), // 96 bits for ChaCha20-Poly1305
    AUTH_TAG_LENGTH: 16, // 128 bits, fixed for ChaCha20-Poly1305
  },
}
