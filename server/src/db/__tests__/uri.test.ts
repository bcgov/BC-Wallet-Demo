import { afterEach, describe, expect, it, vi } from 'vitest'

import { getMongoUri } from '../uri'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getMongoUri', () => {
  it('returns MONGODB_URI directly when set', () => {
    vi.stubEnv('MONGODB_URI', 'mongodb://custom-host:27017/mydb')
    expect(getMongoUri()).toBe('mongodb://custom-host:27017/mydb')
  })

  it('builds URI from parts with no auth', () => {
    vi.stubEnv('MONGODB_URI', '')
    vi.stubEnv('MONGODB_HOST', 'db.example.com')
    vi.stubEnv('MONGODB_PORT', '27018')
    vi.stubEnv('MONGODB_DB_NAME', 'myapp')
    expect(getMongoUri()).toBe('mongodb://db.example.com:27018/myapp')
  })

  it('includes credentials and authSource=admin when user and password are set', () => {
    vi.stubEnv('MONGODB_URI', '')
    vi.stubEnv('MONGODB_HOST', 'db.example.com')
    vi.stubEnv('MONGODB_PORT', '27017')
    vi.stubEnv('MONGODB_DB_NAME', 'myapp')
    vi.stubEnv('MONGODB_USER', 'admin')
    vi.stubEnv('MONGODB_PASSWORD', 'secret')
    expect(getMongoUri()).toBe('mongodb://admin:secret@db.example.com:27017/myapp?authSource=admin')
  })

  it('percent-encodes special characters in credentials', () => {
    vi.stubEnv('MONGODB_URI', '')
    vi.stubEnv('MONGODB_HOST', 'localhost')
    vi.stubEnv('MONGODB_PORT', '27017')
    vi.stubEnv('MONGODB_DB_NAME', 'myapp')
    vi.stubEnv('MONGODB_USER', 'user@name')
    vi.stubEnv('MONGODB_PASSWORD', 'p@ss:word')
    expect(getMongoUri()).toBe('mongodb://user%40name:p%40ss%3Aword@localhost:27017/myapp?authSource=admin')
  })

  it('falls back to localhost defaults when no env vars are set', () => {
    vi.stubEnv('MONGODB_URI', '')
    vi.stubEnv('MONGODB_HOST', '')
    vi.stubEnv('MONGODB_PORT', '')
    vi.stubEnv('MONGODB_DB_NAME', '')
    expect(getMongoUri()).toBe('mongodb://localhost:27017/bcwallet_demo')
  })

  it('does not include credentials when only user is set without password', () => {
    vi.stubEnv('MONGODB_URI', '')
    vi.stubEnv('MONGODB_HOST', 'localhost')
    vi.stubEnv('MONGODB_PORT', '27017')
    vi.stubEnv('MONGODB_DB_NAME', 'myapp')
    vi.stubEnv('MONGODB_USER', 'admin')
    vi.stubEnv('MONGODB_PASSWORD', '')
    expect(getMongoUri()).toBe('mongodb://localhost:27017/myapp')
  })
})
