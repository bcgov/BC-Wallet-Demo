import type { Request } from 'express'

/** Browser-visible origin (scheme + host, no path) for short invitation URLs. */
export function resolvePublicOrigin(req?: Request): string {
  const configured = process.env.SHOWCASE_PUBLIC_ORIGIN?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }
  if (req) {
    const proto = req.get('x-forwarded-proto')?.split(',')[0]?.trim() || req.protocol
    const host = req.get('x-forwarded-host')?.split(',')[0]?.trim() || req.get('host')
    if (host) {
      return `${proto}://${host}`
    }
  }
  return 'http://127.0.0.1:5000'
}
