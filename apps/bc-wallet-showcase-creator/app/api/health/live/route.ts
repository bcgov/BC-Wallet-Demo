import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    alive: true,
    timestamp: new Date().toISOString(),
    service: 'bc-wallet-showcase-creator',
  })
}
