import { debugLog } from '@/lib/utils'
import { Tenant, TenantResponse } from 'bc-wallet-openapi'
import { NextResponse } from 'next/server'

async function fetchTenantConfig(tenantId: string): Promise<Tenant> {
  try {
    const endpoint = `${process.env.NEXT_PUBLIC_SHOWCASE_API_URL}/tenants/${tenantId}`
    debugLog(`Fetching tenant config for ${tenantId}`, endpoint)
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      debugLog('Tenant config fetch failed:', response.status, response.statusText)
    }
    const tenantResponse = (await response.json()) as TenantResponse
    return tenantResponse.tenant
  } catch (error) {
    debugLog('Error fetching tenant config:', error)
    return Promise.reject(error instanceof Error ? error : new Error(tenantId))
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId) {
    return NextResponse.json({ valid: false, reason: 'Missing clientId' }, { status: 400 })
  }

  try {
    const tenant = await fetchTenantConfig(clientId)
    if (tenant) {
      return NextResponse.json({ valid: true, tenant })
    } else {
      return NextResponse.json({ valid: false, reason: 'Tenant not found' }, { status: 404 })
    }
  } catch (e) {
    return NextResponse.json({ valid: false, reason: 'Error validating tenant' }, { status: 500 })
  }
}