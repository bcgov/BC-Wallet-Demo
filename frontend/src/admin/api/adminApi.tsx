import type { CustomCharacter } from '../types'
import type { AuthContextProps } from 'react-oidc-context'

const baseRoute = import.meta.env.VITE_BASE_ROUTE || '/digital-trust/showcase'
export const adminBaseRoute = `${baseRoute}/admin`
export const adminBaseUrl = (import.meta.env.VITE_HOST_BACKEND || '') + adminBaseRoute
export const publicBaseUrl = (import.meta.env.VITE_HOST_BACKEND || '') + baseRoute

export const getAllCharacters = async (auth: AuthContextProps): Promise<CustomCharacter[]> => {
  const res = await fetch(`${adminBaseUrl}/characters`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const data = (await res.json()) as CustomCharacter[]
  return data
}

export const getCharacterByName = async (auth: AuthContextProps, name: string): Promise<CustomCharacter> => {
  const res = await fetch(`${adminBaseUrl}/characters/${encodeURIComponent(name)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const data = (await res.json()) as CustomCharacter
  return data
}

export interface SVGFile {
  path: string
  name: string
}

export const getAvailableSvgs = async (auth: AuthContextProps): Promise<string[]> => {
  const res = await fetch(`${adminBaseUrl}/svgs`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const data = (await res.json()) as { files: string[] }
  return data.files
}

export const updateCharacter = async (
  auth: AuthContextProps,
  characterName: string,
  updates: Partial<CustomCharacter>,
): Promise<CustomCharacter> => {
  const res = await fetch(`${adminBaseUrl}/characters/${encodeURIComponent(characterName)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const errorData = (await res.json()) as { error?: string }
    throw new Error(errorData.error || `Request failed: ${res.status}`)
  }
  const data = (await res.json()) as CustomCharacter
  return data
}

export const uploadSvg = async (auth: AuthContextProps, file: File): Promise<{ path: string; filename: string }> => {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${adminBaseUrl}/svgs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
    },
    body: formData,
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const data = (await res.json()) as { path: string; filename: string }
  return data
}

export const createShowcase = async (
  auth: AuthContextProps,
  name: string,
  description: string,
): Promise<{ success: boolean; message: string; filename: string; name: string }> => {
  const res = await fetch(`${adminBaseUrl}/characters`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description }),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const data = (await res.json()) as { success: boolean; message: string; filename: string; name: string }
  return data
}

export const getAllCredentials = async (auth: AuthContextProps): Promise<Credential[]> => {
  const res = await fetch(`${adminBaseUrl}/credentials`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const data = (await res.json()) as Credential[]
  return data
}
