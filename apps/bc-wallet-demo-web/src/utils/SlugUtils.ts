import { useParams } from 'react-router-dom'

export function useSlug(): string {
  const params = useParams()
  const inputSlug = params['slug']

  if (!inputSlug) {
    throw Error('No slug provided')
  }

  return inputSlug
}

export function usePersonaSlug(): string {
  const params = useParams()
  const inputSlug = params['personaSlug']

  if (!inputSlug) {
    throw Error('No slug provided')
  }

  return inputSlug
}
