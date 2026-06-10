import rateLimit from 'express-rate-limit'

export const rateLimiter = (options?: { windowMs?: number; max?: number; message?: string }) => {
  return rateLimit({
    windowMs: options?.windowMs ?? 15 * 60 * 1000,
    max: options?.max ?? 30,
    message: options?.message ?? 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  })
}
