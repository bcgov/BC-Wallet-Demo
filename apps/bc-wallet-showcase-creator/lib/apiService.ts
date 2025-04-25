'use client'

import { env } from '@/env'
import { getSession, signIn } from 'next-auth/react'

class ApiService {
  private readonly baseUrl: string

  public constructor(baseUrl: string) {
    if (!baseUrl) {
      throw new Error('API base URL is required')
    }
    this.baseUrl = baseUrl
  }

  private async request<T>(method: string, url: string, data?: Record<string, unknown>): Promise<T | void> {
    const fullUrl = `${this.baseUrl}${url}`
    const accessToken = method !== 'GET' ? await this.getAuthToken() : undefined

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

      console.log('Response Status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`)
      }

      if (response.status === 204) {
        console.log('No Content (204), returning void.')
        return
      }

      const jsonData = await response.json()
      console.log('API Response JSON:', jsonData)
      return jsonData
    } catch (error) {
      console.error('Fetch Error:', error)
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

    if (!session?.accessToken) {
      void (await signIn('keycloak'))
      return null
    }

    // Check for a refresh error
    if (session?.error === 'RefreshAccessTokenError') {
      void (await signIn('keycloak'))
      return null
    }

    return session.accessToken
  }
}

const apiClient = new ApiService(env.NEXT_PUBLIC_SHOWCASE_BACKEND)

export default apiClient
