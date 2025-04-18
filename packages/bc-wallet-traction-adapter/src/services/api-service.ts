import { ApiResponse, ResponseError } from 'bc-wallet-traction-openapi'

export abstract class ApiService {
  protected async handleApiResponse<T>(response: ApiResponse<T>): Promise<T> {
    if (!response.raw.ok) {
      let errorText = 'No error details available'
      try {
        errorText = await response.raw.text()
      } catch (e) {
        // Ignore error trying to read body
      }
      // Throw ResponseError for structured error handling
      throw new ResponseError(response.raw, `HTTP error! Status: ${response.raw.status}, Details: ${errorText}`)
    }
    try {
      return await response.value()
    } catch (e) {
      // Handle cases where parsing the response body fails
      console.error('Error parsing response value:', e)
      throw new Error(`Failed to parse response body: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  protected handleServiceError(error: unknown, operation: string): Promise<never> {
    console.error(`Error ${operation}:`, error)
    if (error instanceof Error) {
      return Promise.reject(error)
    }
    return Promise.reject(new Error(`Unknown error ${operation}`))
  }
}
