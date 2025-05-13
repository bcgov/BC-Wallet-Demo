'use client'

import { env } from '@/env'
import { getTenantId } from '@/providers/tenant-provider'
import { getSession, signIn } from 'next-auth/react'
import { debugLog } from './utils'

class ApiService {
  private readonly baseUrl: string

  public constructor(baseUrl: string) {
    if (!baseUrl) {
      throw new Error('API base URL is required')
    }
    this.baseUrl = baseUrl
  }

  private buildUrl(path: string): string {
    const tenantId = getTenantId()
    return `${this.baseUrl}/${tenantId}${path}`
  }

  private async request<T>(method: string, url: string, data?: Record<string, unknown>): Promise<T | void> {
    const fullUrl = this.buildUrl(url)
    const accessToken = await this.getAuthToken()

    if (!accessToken && method !== 'GET') {
      return Promise.reject(Error('No access token found'))
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(fullUrl, options)

      debugLog('Response Status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`)
      }

      if (response.status === 204) {
        debugLog('No Content (204), returning status object.')
        return { status: 204 } as unknown as T
      }

      const jsonData = await response.json()
      debugLog('API Response JSON:', jsonData)
      return jsonData
    } catch (error) {
      debugLog('Fetch Error:', error)
      throw error
    }
  }

  public get<T>(url: string, params?: Record<string, string>): Promise<T | void> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<T>('GET', `${url}${queryString}`)
  }

  public post<T>(url: string, data?: any): Promise<T | void> {
    return this.request<T>('POST', url, data)
  }

  public put<T>(url: string, data?: any): Promise<T | void> {
    return this.request<T>('PUT', url, data)
  }

  public delete<T>(url: string): Promise<T | void> {
    return this.request<T>('DELETE', url)
  }

  private async getAuthToken(): Promise<string | null> {
    const session = await getSession()
    console.debug('Session:', session)
    if (session?.accessToken && !session.error) {
      console.debug('Session has access token, returning it.')
      return session.accessToken
    }

    if (!session || session?.error === 'RefreshAccessTokenError') {
      debugLog('No session or RefreshAccessTokenError detected')
      void signIn('keycloak')
      return null
    }

    return null
  }
}

const apiClient = new ApiService(env.NEXT_PUBLIC_SHOWCASE_API_URL)

export default apiClient
