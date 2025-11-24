import type { CorsOptions } from 'cors'

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
    // When wildcard is specified, return string array of common headers
    // because some CORS implementations don't handle '*' correctly
    if (headers.includes('*')) {
      return [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Cache-Control',
        'Pragma',
        'Expires',
        'Accept',
        'Origin',
      ]
    }
    return headers
  })(),
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: process.env.CORS_ALLOW_CREDENTIALS === 'true',
  preflightContinue: false,
  optionsSuccessStatus: 204,
}
