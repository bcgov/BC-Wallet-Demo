import type { CustomCharacter } from '../../types'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

import { adminBaseRoute, getAllCharacters } from '../../api/adminApi'

import { ShowcaseCard } from './ShowcaseCard'
import { CreateShowcaseModal } from './modals/CreateShowcaseModal'

export function ShowcasesPanel() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<CustomCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true)
        const characters = await getAllCharacters(auth)
        setCharacters(characters)
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-bcgov-black font-semibold text-2xl">Showcases</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-bcgov-blue hover:bg-bcgov-blue-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Create Showcase
        </button>
      </div>
      <p className="text-bcgov-darkgrey mb-6">Manage your digital credential showcases.</p>

      {loading && <p className="text-bcgov-darkgrey">Loading showcases…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && !error && characters.length === 0 && <p className="text-bcgov-darkgrey">No showcases found.</p>}

      {!loading && !error && characters.length > 0 && (
        <div className="space-y-4">
          {characters.map((character, idx) => (
            <ShowcaseCard
              key={idx}
              character={character}
              onClick={() => navigate(`${adminBaseRoute}/creator/showcase/${character.name}`, { state: { character } })}
            />
          ))}
        </div>
      )}

      <CreateShowcaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(showcaseName) => {
          setIsCreateModalOpen(false)
          navigate(`${adminBaseRoute}/creator/showcase/${showcaseName}`, { state: { isNewShowcase: true } })
        }}
      />
    </div>
  )
}
