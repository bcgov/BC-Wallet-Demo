import type { CustomCharacter } from '../types'
import type { AuthContextProps } from 'react-oidc-context'

import { baseUrl } from '../../client/api/BaseUrl'

const adminBase = `${baseUrl}/admin`

export const getAllCharacters = async (auth: AuthContextProps): Promise<CustomCharacter[]> => {
  const res = await fetch(`${adminBase}/characters`, {
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
  const res = await fetch(`${adminBase}/characters/${encodeURIComponent(name)}`, {
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
  const res = await fetch(`${adminBase}/svgs`, {
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

export const uploadSvg = async (auth: AuthContextProps, file: File): Promise<{ path: string; filename: string }> => {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${adminBase}/svgs`, {
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
  const res = await fetch(`${adminBase}/characters`, {
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
