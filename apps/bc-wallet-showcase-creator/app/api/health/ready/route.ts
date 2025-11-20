import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ready: true,
    timestamp: new Date().toISOString(),
    service: 'bc-wallet-showcase-creator',
  })
}
