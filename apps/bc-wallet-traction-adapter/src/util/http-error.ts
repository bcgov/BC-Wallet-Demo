interface HttpErrorDetails {
  status: number
  statusText: string
  body?: string
  url?: string
}

export async function buildHttpErrorMessage(response: Response): Promise<string> {
  let body: string | undefined

  try {
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const json = await response.json()
      body = JSON.stringify(json, null, 2)
    } else {
      body = await response.text()
    }
  } catch {
    // Failed to read body, continue without it
  }

  return buildErrorMessage({
    status: response.status,
    statusText: response.statusText,
    body,
    url: response.url,
  })
}

function buildErrorMessage(details: HttpErrorDetails): string {
  const { status, statusText, body, url } = details

  let message = `HTTP ${status}`

  if (statusText && statusText !== status.toString()) {
    message += ` ${statusText}`
  }

  if (url) {
    message += ` - ${url}`
  }

  if (body && body.trim()) {
    const trimmedBody = body.length > 200 ? body.substring(0, 200) + '...' : body
    message += `\n${trimmedBody}`
  }

  return message
}
