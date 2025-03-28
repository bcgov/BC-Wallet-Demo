import { Topic } from './types'

export const environment = {
  messageBroker: {
    AMQ_HOST: process.env.AMQ_HOST || 'localhost',
    AMQ_PORT: parseInt(process.env.AMQ_PORT || '5672', 10),
    AMQ_USER: process.env.AMQ_USER || 'guest',
    AMQ_PASSWORD: process.env.AMQ_PASSWORD || 'guest',
    MESSAGE_PROCESSOR_TOPIC: (process.env.MESSAGE_PROCESSOR_TOPIC ?? 'showcase-cmd') as Topic,
  },
  traction: {
    DEFAULT_API_BASE_PATH: process.env.DEFAULT_API_BASE_PATH ?? 'http://localhost:8032',
    TENANT_SESSION_CACHE_SIZE: parsePositiveInt(process.env.TENANT_SESSION_CACHE_SIZE, 1024),
    TENANT_SESSION_TTL_MINS: parsePositiveInt(process.env.TENANT_SESSION_TTL_MINS, 1440),
  },
  encryption: {
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
    KEY_SIZE: parsePositiveInt(process.env.ENCRYPTION_KEY_SIZE, 32), // 256 bits
    NONCE_SIZE: parsePositiveInt(process.env.ENCRYPTION_NONCE_SIZE, 12), // 96 bits for ChaCha20-Poly1305
    AUTH_TAG_LENGTH: 16, // 128 bits, fixed for ChaCha20-Poly1305
  },
}

function parsePositiveInt(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue
  }

  const parsed = parseInt(value, 10)

  if (isNaN(parsed) || parsed <= 0) {
    return defaultValue
  }

  return parsed
}
