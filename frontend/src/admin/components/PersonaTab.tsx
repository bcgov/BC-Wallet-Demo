import type { CustomCharacter } from '../types'

import { baseUrl } from '../../client/api/BaseUrl'

interface PersonaTabProps {
  character: CustomCharacter | null
  isLoading: boolean
}

export function PersonaTab({ character, isLoading }: PersonaTabProps) {
  return (
    <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
      {/* Persona Tab */}
      <div className="w-full max-w-4xl mb-8">
        <h2 className="text-2xl font-semibold text-bcgov-black">Setup Persona</h2>
        <h5 className="text-gray-500 mt-2">Configure the details for your persona.</h5>
      </div>
      <div className="w-full max-w-4xl px-6 border border-gray-300 rounded-lg bg-white p-8">
        {/* Title Section */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-bcgov-black mb-2">Title</label>
          <input
            type="text"
            value={character?.name || ''}
            disabled={isLoading}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue text-gray-500 bg-gray-100"
          />
        </div>

        {/* Role Section */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-bcgov-black mb-2">Role</label>
          <input
            type="text"
            value={character?.type || ''}
            disabled={isLoading}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue text-gray-500 bg-gray-100"
          />
        </div>

        {/* Introduction Section */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-bcgov-black mb-2">Introduction</label>
          <textarea
            defaultValue="Persona introduction text goes here."
            disabled={isLoading}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue resize-none text-gray-500 bg-gray-100"
            rows={4}
          />
        </div>

        {/* Image Section */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-bcgov-black mb-2">Image</label>
          {character?.image && (
            <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
              <img src={`${baseUrl}${character.image}`} alt={character.name} className="w-full h-full object-contain" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
