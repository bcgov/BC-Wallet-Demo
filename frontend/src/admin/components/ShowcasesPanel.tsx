import type { CustomCharacter } from '../types'

import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

import { baseRoute, baseUrl } from '../../client/api/BaseUrl'

import { CharacterCard } from './CharacterCard'

const adminBase = `${baseUrl}/admin`

export function ShowcasesPanel() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<CustomCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${adminBase}/characters`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${auth.user?.access_token ?? ''}`,
            'Content-Type': 'application/json',
          },
        })
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const data = (await res.json()) as CustomCharacter[]
        setCharacters(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch characters')
      } finally {
        setLoading(false)
      }
    }
    void fetchCharacters()
  }, [auth.user?.access_token])

  return (
    <div>
      <h2 className="text-bcgov-black font-semibold text-2xl mb-2 flex items-center gap-2">Showcases</h2>
      <p className="text-bcgov-darkgrey mb-6">Manage your digital credential showcases.</p>

      {loading && <p className="text-bcgov-darkgrey">Loading showcases…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && !error && characters.length === 0 && <p className="text-bcgov-darkgrey">No showcases found.</p>}

      {!loading && !error && characters.length > 0 && (
        <div className="space-y-4">
          {characters.map((character, idx) => (
            <CharacterCard
              key={idx}
              character={character}
              idx={idx}
              isExpanded={false}
              onToggle={() => navigate(`${baseRoute}/admin/creator/showcase/${character.name}`)}
              expandedUseCase={null}
              setExpandedUseCase={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  )
}
