import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { env } from '@/env'

export async function GET(req: NextRequest) {
  const secureCookie = req.nextUrl.protocol === 'https:'
  const token = await getToken({
    req,
    secret: env.AUTH_SECRET,
    secureCookie,
  })
  if (!token || typeof token.access_token !== 'string') {
    throw new Error('Missing access_token in session')
  }

  const parts = token.access_token.split('.')
  if (parts.length < 2) {
    throw new Error('Invalid access_token format')
  }

  let payload: any
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
  } catch {
    throw new Error('Failed to decode access_token payload')
  }

  const issuer = payload.iss
  if (!issuer) {
    throw new Error('Issuer (iss) claim not found in access_token')
  }

  return NextResponse.json({ issuer })
}
