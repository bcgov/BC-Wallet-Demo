import bs58 from 'bs58'
import { Buffer } from 'buffer'
import crypto from 'crypto'

import { environment } from '../environment'

// TODO move to common package to dedup

const envEnc = environment.encryption

function isChaCha20Poly1305Supported(): boolean {
  const supportedAlgorithms = crypto.getCiphers()
  return supportedAlgorithms.includes('chacha20-poly1305')
}

if (!isChaCha20Poly1305Supported()) {
  throw new Error('ChaCha20-Poly1305 is not supported in this Node.js version. Please upgrade to a newer version.')
}

/**
 * Encodes a key buffer to a Base58 string for storage
 * @param key The key buffer to encode
 * @returns Base58 encoded string representation of the key
 */
function encodeKey(key: Buffer): string {
  return bs58.encode(key)
}

/**
 * Decodes a Base58 encoded key string to a Buffer
 * @param encodedKey Base58 encoded key string
 * @returns Buffer containing the decoded key
 */
function decodeKey(encodedKey: string): Buffer {
  return Buffer.from(bs58.decode(encodedKey))
}

/**
 * Generates a random encryption key of specified size
 * @param size Key size in bytes (default from environment or 32 bytes)
 * @returns Base58 encoded string representation of the generated key
 */
export function generateKey(size: number = envEnc.KEY_SIZE): string {
  const keyBuffer = crypto.randomBytes(size)
  return encodeKey(keyBuffer)
}

/**
 * Gets the encryption key from environment variable or generates one if not available
 * @returns Buffer containing the encryption key
 * @throws Error when the ENCRYPTION_KEY env var is not found
 */
function getKeyFromEnv(): Buffer {
  if (!envEnc.ENCRYPTION_KEY) {
    throw Error('No encryption key found in the environment variables.')
  }

  return decodeKey(envEnc.ENCRYPTION_KEY)
}

/**
 * Validates that the key and nonce sizes are correct for ChaCha20-Poly1305
 * @param key The encryption key
 * @param nonceSize The nonce size
 * @throws Error if key or nonce size is invalid
 */
function validateParameters(key: Buffer, nonceSize: number): void {
  if (key.length !== envEnc.KEY_SIZE) {
    throw new Error(`Invalid key size. ChaCha20-Poly1305 requires a ${envEnc.KEY_SIZE}-byte key.`)
  }

  if (nonceSize !== envEnc.NONCE_SIZE) {
    throw new Error(`Invalid nonce size. ChaCha20-Poly1305 requires a ${envEnc.NONCE_SIZE}-byte nonce.`)
  }
}

/**
 * Encrypts a Buffer using ChaCha20-Poly1305 with the environment key
 * @param data Buffer containing data to encrypt
 * @param nonceSize Size of the nonce in bytes (default from environment)
 * @returns Object containing encrypted data and nonce
 */
export function encryptBuffer(
  data: Buffer,
  nonceSize: number = envEnc.NONCE_SIZE,
): { encrypted: Buffer; nonce: Buffer } {
  const key = getKeyFromEnv()
  validateParameters(key, nonceSize)

  // Generate a random nonce
  const nonce = crypto.randomBytes(nonceSize)

  // Create cipher - use 'chacha20-poly1305' algorithm
  const cipher = crypto.createCipheriv('chacha20-poly1305', key, nonce, {
    authTagLength: envEnc.AUTH_TAG_LENGTH,
  })

  // Encrypt data
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()])

  // Get authentication tag
  const authTag = cipher.getAuthTag()

  // Combine ciphertext and auth tag
  const encrypted = Buffer.concat([ciphertext, authTag])

  return { encrypted, nonce }
}

/**
 * Decrypts a Buffer using ChaCha20-Poly1305 with the environment key
 * @param encryptedData Buffer containing encrypted data with auth tag
 * @param nonce Nonce used during encryption
 * @returns Buffer containing decrypted data
 * @throws Error if decryption fails
 */
export function decryptBuffer(encryptedData: Buffer, nonce: Buffer): Buffer {
  const key = getKeyFromEnv()
  validateParameters(key, nonce.length)

  if (encryptedData.length <= envEnc.AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted data: too short to contain authentication tag')
  }

  // Extract auth tag (last 16 bytes)
  const authTag = encryptedData.slice(encryptedData.length - envEnc.AUTH_TAG_LENGTH)
  const ciphertext = encryptedData.slice(0, encryptedData.length - envEnc.AUTH_TAG_LENGTH)

  // Create decipher
  const decipher = crypto.createDecipheriv('chacha20-poly1305', key, nonce, {
    authTagLength: envEnc.AUTH_TAG_LENGTH,
  })

  // Set auth tag
  decipher.setAuthTag(authTag)

  // Decrypt data
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

/**
 * Encrypts a string using ChaCha20-Poly1305 with the environment key
 * @param text String to encrypt
 * @param nonceSize Size of the nonce in bytes (default from environment)
 * @returns Object containing base64 encoded encrypted data and nonce
 */
export function encryptString(
  text: string,
  nonceSize: number = envEnc.NONCE_SIZE,
): { encryptedBase64: string; nonceBase64: string } {
  const result = encryptBuffer(Buffer.from(text, 'utf8'), nonceSize)
  return {
    encryptedBase64: result.encrypted.toString('base64'),
    nonceBase64: result.nonce.toString('base64'),
  }
}

/**
 * Decrypts a string using ChaCha20-Poly1305 with the environment key
 * @param encryptedBase64 Base64 encoded encrypted data with auth tag
 * @param nonceBase64 Base64 encoded nonce used during encryption
 * @returns Decrypted string
 * @throws Error if decryption fails
 */
export function decryptString(encryptedBase64: string, nonceBase64: string): string {
  const encryptedData = Buffer.from(encryptedBase64, 'base64')
  const nonce = Buffer.from(nonceBase64, 'base64')

  const decrypted = decryptBuffer(encryptedData, nonce)
  return decrypted.toString('utf8')
}

/**
 * Decrypts a string using ChaCha20-Poly1305 with the environment key
 * @param encryptedData Buffer containing encrypted data with auth tag
 * @param nonce Buffer containing nonce used during encryption
 * @returns Decrypted string
 * @throws Error if decryption fails
 */
export function decryptBufferAsString(encryptedData: Buffer, nonce: Buffer): string {
  const decrypted = decryptBuffer(encryptedData, nonce)
  return decrypted.toString('utf8')
}

/**
 * Encrypts a Uint8Array using ChaCha20-Poly1305 with the environment key
 * @param data Uint8Array containing data to encrypt
 * @param nonceSize Size of the nonce in bytes (default from environment)
 * @returns Object containing encrypted data and nonce as Uint8Arrays
 */
export function encryptBytes(
  data: Uint8Array,
  nonceSize: number = envEnc.NONCE_SIZE,
): { encrypted: Uint8Array; nonce: Uint8Array } {
  const result = encryptBuffer(Buffer.from(data), nonceSize)
  return {
    encrypted: new Uint8Array(result.encrypted),
    nonce: new Uint8Array(result.nonce),
  }
}

/**
 * Decrypts a Uint8Array using ChaCha20-Poly1305 with the environment key
 * @param encryptedData Uint8Array containing encrypted data with auth tag
 * @param nonce Uint8Array containing nonce used during encryption
 * @returns Uint8Array containing decrypted data
 * @throws Error if decryption fails
 */
export function decryptBytes(encryptedData: Uint8Array, nonce: Uint8Array): Uint8Array {
  const result = decryptBuffer(Buffer.from(encryptedData), Buffer.from(nonce))
  return new Uint8Array(result)
}

/**
 * Main function that can be called from command line
 */
function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'generate-key':
      const key = generateKey()
      console.log('Generated key:', key)
      break
    default:
      console.log('Unknown command. Available commands: generate-key')
  }
}

// Run main if this file is executed directly
if (require.main === module) {
  main()
}
