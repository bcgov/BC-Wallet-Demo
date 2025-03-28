import { Topic } from './types/adapter-backend'

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

export const environment = {
  messageBroker: {
    AMQ_HOST: process.env.AMQ_HOST || 'localhost',
    AMQ_PORT: parseInt(process.env.AMQ_PORT || '5672', 10),
    AMQ_USER: process.env.AMQ_USER || 'guest',
    AMQ_PASSWORD: process.env.AMQ_PASSWORD || 'guest',
    MESSAGE_PROCESSOR_TOPIC: validateTopic(process.env.MESSAGE_PROCESSOR_TOPIC) ?? Topic.SHOWCASE_CMD,
  },
  encryption: {
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
    KEY_SIZE: parsePositiveInt(process.env.ENCRYPTION_KEY_SIZE, 32), // 256 bits
    NONCE_SIZE: parsePositiveInt(process.env.ENCRYPTION_NONCE_SIZE, 12), // 96 bits for ChaCha20-Poly1305
    AUTH_TAG_LENGTH: 16, // 128 bits, fixed for ChaCha20-Poly1305
  },
}
