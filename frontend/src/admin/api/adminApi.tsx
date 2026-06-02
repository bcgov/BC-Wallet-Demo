import type { Showcase, Credential, Schema } from '../types'
import type { AuthContextProps } from 'react-oidc-context'

const baseRoute = import.meta.env.VITE_BASE_ROUTE || '/digital-trust/showcase'
export const adminBaseRoute = `${baseRoute}/admin`
export const adminBaseUrl = (import.meta.env.VITE_HOST_BACKEND || '') + adminBaseRoute
export const publicBaseUrl = (import.meta.env.VITE_HOST_BACKEND || '') + baseRoute

// ============================================================================
// ERROR HANDLING
// ============================================================================

const handleErrorResponse = async (res: Response): Promise<never> => {
  let message = `Request failed: ${res.status}`

  try {
    const errorData = (await res.json()) as { error?: string }
    if (errorData.error) {
      message = errorData.error
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Response body is not valid JSON, use status-only message
    } else {
      throw error
    }
  }

  throw new Error(message)
}

// ============================================================================
// SHOWCASE ENDPOINTS
// ============================================================================

export const getAllShowcases = async (auth: AuthContextProps): Promise<Showcase[]> => {
  const res = await fetch(`${adminBaseUrl}/showcases`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) await handleErrorResponse(res)
  const data = (await res.json()) as Showcase[]
  return data
}

export const getShowcaseByName = async (auth: AuthContextProps, name: string): Promise<Showcase> => {
  const res = await fetch(`${adminBaseUrl}/showcases/${encodeURIComponent(name)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) await handleErrorResponse(res)
  const data = (await res.json()) as Showcase
  return data
}

export const createShowcase = async (
  auth: AuthContextProps,
  name: string,
  description: string,
): Promise<{ success: boolean; message: string; filename: string; name: string }> => {
  const newShowcase: Partial<Showcase> = {
    name,
    description,
    persona: {
      name: '',
      image: '',
    },
    introduction: [],
    progressBar: [],
    credentials: [],
    status: 'pending',
  }
  const res = await fetch(`${adminBaseUrl}/showcases`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newShowcase),
  })
  if (!res.ok) await handleErrorResponse(res)
  const data = (await res.json()) as { success: boolean; message: string; filename: string; name: string }
  return data
}

export const updateShowcase = async (
  auth: AuthContextProps,
  showcaseName: string,
  updates: Partial<Showcase>,
): Promise<Showcase> => {
  // Only dehydrate credentials if they were actually provided in the update
  const dehydratedUpdates: any = { ...updates }

  if (updates.credentials) {
    dehydratedUpdates.credentials = updates.credentials.map((cred) => (typeof cred === 'string' ? cred : cred.id))
  }

  if (updates.introduction) {
    dehydratedUpdates.introduction = updates.introduction.map((step) => ({
      ...step,
      credentials: step.credentials?.map((cred) => (typeof cred === 'string' ? cred : cred.id)) || [],
    }))
  }

  const res = await fetch(`${adminBaseUrl}/showcases/${encodeURIComponent(showcaseName)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dehydratedUpdates),
  })
  if (!res.ok) await handleErrorResponse(res)
  const data = (await res.json()) as Showcase
  return data
}

export const deleteScreenFromShowcase = async (
  auth: AuthContextProps,
  showcaseName: string,
  screenId: string,
): Promise<Showcase> => {
  // Get the current showcase
  const showcase = await getShowcaseByName(auth, showcaseName)

  // Remove the screen from the introduction array
  const updatedIntroduction = showcase.introduction.filter((screen) => screen.screenId !== screenId)

  // Remove any progressBar entries that reference the deleted screen
  const updatedProgressBar = showcase.progressBar?.filter((entry) => entry.introductionStep !== screenId) || []

  // Update the showcase with the filtered introduction and progressBar arrays
  return updateShowcase(auth, showcaseName, {
    introduction: updatedIntroduction,
    progressBar: updatedProgressBar,
  })
}

// ============================================================================
// CREDENTIAL ENDPOINTS
// ============================================================================

export const getAllCredentials = async (auth: AuthContextProps): Promise<Credential[]> => {
  const res = await fetch(`${adminBaseUrl}/credentials?status=active`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) await handleErrorResponse(res)
  const data = (await res.json()) as Credential[]
  return data
}

export const createCredential = async (
  auth: AuthContextProps,
  credential: Omit<Credential, 'id'>,
): Promise<Credential> => {
  const res = await fetch(`${adminBaseUrl}/credentials`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credential),
  })
  if (!res.ok) await handleErrorResponse(res)
  const data = (await res.json()) as Credential
  return data
}

// ============================================================================
// IMAGE ENDPOINTS
// ============================================================================

export const getAvailableImages = async (
  auth: AuthContextProps,
  type: 'icon' | 'screen' | 'persona' = 'icon',
): Promise<string[]> => {
  const res = await fetch(`${adminBaseUrl}/assets?type=${encodeURIComponent(type)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) await handleErrorResponse(res)
  const data = (await res.json()) as { files: string[] }
  return data.files
}

export const uploadImage = async (
  auth: AuthContextProps,
  file: File,
  type: 'icon' | 'screen' | 'persona' = 'icon',
): Promise<{ path: string; filename: string }> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)

  const res = await fetch(`${adminBaseUrl}/assets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
    },
    body: formData,
  })
  if (!res.ok) await handleErrorResponse(res)
  const data = (await res.json()) as { path: string; filename: string }
  return data
}

// ============================================================================
// SCHEMA ENDPOINTS
// ============================================================================
export const getAvailableSchemas = async (auth: AuthContextProps): Promise<Schema[]> => {
  const res = await fetch(`${adminBaseUrl}/schemas`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) await handleErrorResponse(res)
  const data = await res.json()
  return data
}

export const createSchema = async (
  auth: AuthContextProps,
  schemaData: { name: string; version: string; attrNames: string[] },
): Promise<Schema> => {
  const res = await fetch(`${adminBaseUrl}/schemas`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(schemaData),
  })
  if (!res.ok) await handleErrorResponse(res)
  const data = (await res.json()) as Schema
  // Ensure attrNames is populated from the request if not in response
  return data
}
