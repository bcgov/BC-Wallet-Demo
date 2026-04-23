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

export const getCharacter = async (auth: AuthContextProps, name: string): Promise<CustomCharacter> => {
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
