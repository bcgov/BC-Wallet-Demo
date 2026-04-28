import type { CustomCharacter } from '../types'

import { useEffect, useRef, useState } from 'react'
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
  const accessToken = auth.user?.access_token
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const refetchRef = useRef(() => setRefreshTrigger((prev) => prev + 1))

  useEffect(() => {
    // Always fetch by name from URL if available (more reliable than state which is transient)
    if (name && accessToken) {
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
      return
    }

    // Fallback: use passed character via state
    if (passedCharacter) {
      setCharacter(passedCharacter)
      setIsLoading(false)
      return
    }

    // No way to get character
    setIsLoading(false)
  }, [name, accessToken, passedCharacter, auth, refreshTrigger])

  return { character, isLoading, error, refetch: refetchRef.current }
}
