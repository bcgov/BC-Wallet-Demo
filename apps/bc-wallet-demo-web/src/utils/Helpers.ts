export const isConnected = (state: string) => {
  return state === 'complete' || state === 'response' || state === 'active'
}

export const isDataUrl = (value?: string) => {
  return value && value.startsWith('data:image/')
}

export const isCredIssued = (state: string) => {
  return state === 'credential_issued' || state === 'done' || state === 'credential_acked'
}

// FIXME this implementation is too brittle and change REACT_APP_BASE_ROUTE may break this
export function getTenantIdFromPath(): string | null {
  if (typeof window === 'undefined') return null

  const pathSegments = window.location.pathname.split('/')
  const tenant = pathSegments[3]
  return tenant
}
