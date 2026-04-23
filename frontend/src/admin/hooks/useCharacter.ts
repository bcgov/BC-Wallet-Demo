import type { CustomCharacter } from '../types'

import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { useLocation, useParams } from 'react-router-dom'

import { getCharacterByName } from '../api/adminApi'

export function useCharacter() {
  const location = useLocation()
  const { name } = useParams<{ name: string }>()
  const passedCharacter = location.state?.character as CustomCharacter | undefined
  const [character, setCharacter] = useState<CustomCharacter | null>(passedCharacter || null)
  const [isLoading, setIsLoading] = useState(!passedCharacter)
  const [error, setError] = useState<string | null>(null)
  const auth = useAuth()

  useEffect(() => {
    // If character was passed via state, no need to fetch
    if (passedCharacter) {
      setCharacter(passedCharacter)
      setIsLoading(false)
      return
    }

    // Otherwise fetch by name
    if (!name) {
      setIsLoading(false)
      return
    }

    const fetchCharacter = async () => {
      try {
        setIsLoading(true)
        const character = await getCharacterByName(auth, name)
        setCharacter(character)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch character')
        setCharacter(null)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCharacter()
  }, [name, passedCharacter, auth])

  return { character, isLoading, error }
}
