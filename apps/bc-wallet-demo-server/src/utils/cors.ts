import type { CorsOptions } from 'cors'

// TODO duplicate code, move to a common package in the future

export const corsOptions: CorsOptions = {
  origin: (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const origins = process.env.CORS_ALLOW_ORIGINS?.replace(/\s+/g, '').split(/[,;]/).filter(Boolean) ?? ['*']

    if (!requestOrigin || process.env.CORS_DISABLED === 'true') return callback(null, true)
    if (origins.includes('*') || origins.includes(requestOrigin)) {
      return callback(null, true)
    }
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.'
    return callback(new Error(msg), false)
  },
  methods: (() => {
    const methods = process.env.CORS_ALLOW_METHODS?.replace(/\s+/g, '').split(/[,;]/).filter(Boolean) ?? [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'OPTIONS',
    ]
    return methods.includes('*') ? '*' : methods
  })(),
  allowedHeaders: (() => {
    const headers = process.env.CORS_ALLOW_HEADERS?.replace(/\s+/g, '').split(/[,;]/).filter(Boolean) ?? [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Cache-Control',
      'Pragma',
      'Expires',
    ]
    return headers.includes('*') ? '*' : headers
  })(),
  credentials: process.env.CORS_ALLOW_CREDENTIALS === 'true',
}
