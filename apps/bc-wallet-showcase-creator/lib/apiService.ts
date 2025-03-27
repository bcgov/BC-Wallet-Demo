class ApiService {
  private baseUrl: string

  public constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(method: string, url: string, data?: Record<string, unknown>): Promise<T | void> {
    const fullUrl = `${this.baseUrl}${url}`
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }

    console.log('Fetching URL:', fullUrl, 'Options:', options)

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

  public post<T>(url: string, data?: Record<string, unknown>): Promise<T | void> {
    return this.request<T>('POST', url, data)
  }

  public put<T>(url: string, data?: Record<string, unknown>): Promise<T | void> {
    return this.request<T>('PUT', url, data)
  }

  public delete<T>(url: string): Promise<T | void> {
    return this.request<T>('DELETE', url)
  }
}

// Create an instance with the actual API base URL
const apiClient = new ApiService("http://localhost:3001");
// const apiClient = new ApiService('https://bcshowcase-api.dev.nborbit.ca')

export default apiClient
