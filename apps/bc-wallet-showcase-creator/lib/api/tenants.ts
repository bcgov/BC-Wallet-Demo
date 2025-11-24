import { getSession } from 'next-auth/react'
import { baseUrl } from '../utils'

export interface Tenant {
  id: string
  oidcIssuer: string
  tractionTenantId: string | null
  tractionWalletId: string | null
  tractionApiUrl: string | null
  tractionApiKey: string | null
  createdAt: string
  updatedAt: string
}

export interface TenantRequest {
  id: string
  oidcIssuer: string
  tractionTenantId?: string
  tractionWalletId?: string
  tractionApiUrl?: string
  tractionApiKey?: string
}

export interface TenantsResponse {
  tenants: Tenant[]
}

export interface TenantResponse {
  tenant: Tenant
}

/**
 * Get the authorization header with Bearer token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getSession()
  return {
    'Content-Type': 'application/json',
    ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
  }
}

/**
 * Fetch all tenants
 */
export async function getAllTenants(): Promise<Tenant[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${baseUrl}/tenants`, {
    method: 'GET',
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Failed to fetch tenants:', response.status, errorText)
    throw new Error(`Failed to fetch tenants: ${response.status} ${response.statusText}`)
  }

  const data: TenantsResponse = await response.json()
  console.log('Fetched tenants:', data)
  return data.tenants
}

/**
 * Get a specific tenant by ID
 */
export async function getTenant(id: string): Promise<Tenant> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${baseUrl}/tenants/${id}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch tenant: ${response.statusText}`)
  }

  const data: TenantResponse = await response.json()
  return data.tenant
}

/**
 * Create a new tenant
 */
export async function createTenant(tenantData: TenantRequest): Promise<Tenant> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${baseUrl}/tenants`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(tenantData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create tenant: ${errorText || response.statusText}`)
  }

  const data: TenantResponse = await response.json()
  return data.tenant
}

/**
 * Update an existing tenant
 */
export async function updateTenant(id: string, tenantData: TenantRequest): Promise<Tenant> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${baseUrl}/tenants/${id}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(tenantData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to update tenant: ${errorText || response.statusText}`)
  }

  const data: TenantResponse = await response.json()
  return data.tenant
}

/**
 * Delete a tenant
 */
export async function deleteTenant(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${baseUrl}/tenants/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete tenant: ${response.statusText}`)
  }
}
