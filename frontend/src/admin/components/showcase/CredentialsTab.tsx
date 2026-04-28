import type { CustomCharacter } from '../../types'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

import { baseRoute } from '../../../client/api/BaseUrl'
import { CredentialCard } from '../credential/CredentialCard'

interface CredentialsTabProps {
  character: CustomCharacter | null
}

export function CredentialsTab({ character }: CredentialsTabProps) {
  const navigate = useNavigate()

  return (
    <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
      {/* Credentials Tab */}
      <div className="w-full max-w-6xl mb-8 px-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-bcgov-black">Credentials</h2>
          <h5 className="text-gray-500 mt-2">
            Manage credential configurations for this showcase. These will be displayed as issuance QR codes during the
            Introduction.
          </h5>
        </div>
        <button
          onClick={() =>
            navigate(`${baseRoute}/admin/creator/credentials`, {
              state: { fromShowcase: true, characterName: character?.name },
            })
          }
          className="flex items-center gap-2 px-4 py-2 bg-bcgov-blue text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Credential
        </button>
      </div>
      <div className="w-full max-w-6xl px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {character?.onboarding?.flatMap(
            (screen, idx) =>
              screen.credentials?.map((credential, credIdx) => (
                <CredentialCard key={`${idx}-${credIdx}`} credential={credential} />
              )) || [],
          )}
        </div>
      </div>
    </div>
  )
}
