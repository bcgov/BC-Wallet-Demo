import type { CustomCharacter } from '../types'

import { useEffect, useState } from 'react'

import { baseUrl } from '../../client/api/BaseUrl'

interface ScenariosTabProps {
  character: CustomCharacter | null
}

export function ScenariosTab({ character }: ScenariosTabProps) {
  const [activeUseCase, setActiveUseCase] = useState<string | null>(null)

  useEffect(() => {
    if (character?.useCases?.length) {
      setActiveUseCase(character.useCases[0].id)
    }
  }, [character?.useCases])

  return (
    <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
      {/* Scenarios Tab */}
      <div className="w-full max-w-6xl mb-8 px-6">
        <h2 className="text-2xl font-semibold text-bcgov-black">Scenarios</h2>
        <h5 className="text-gray-500 mt-2">Create scenarios to walk users through credential usage.</h5>
      </div>

      {/* Inner Tabs for Use Cases */}
      <div className="w-full max-w-6xl px-6 mb-6">
        <div className="flex gap-4 border-b border-gray-200">
          {character?.useCases?.map((useCase) => (
            <button
              key={useCase.id}
              onClick={() => setActiveUseCase(useCase.id)}
              className={`py-2 px-3 font-medium transition-colors border-b-2 ${
                activeUseCase === useCase.id
                  ? 'border-bcgov-blue-light text-bcgov-blue-light'
                  : 'border-transparent text-bcgov-darkgrey hover:text-bcgov-black'
              }`}
            >
              {useCase.name}
            </button>
          ))}
        </div>
      </div>

      {/* Use Case Content */}
      <div className="w-full max-w-6xl px-6 space-y-6">
        {character?.useCases?.map((useCase) =>
          activeUseCase === useCase.id ? (
            <div key={useCase.id}>
              {useCase.screens?.map((screen, idx) => (
                <div key={idx} className="border border-gray-300 rounded-lg bg-white p-8 mb-6">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-bcgov-black mb-2">
                        {screen.screenId
                          .replace(/_/g, ' ')
                          .split(' ')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ')}
                      </p>
                      <p className="text-xs font-semibold text-bcgov-black mb-1">{screen.title}</p>
                      <p className="text-xs text-gray-600">{screen.text}</p>
                    </div>
                    {screen.image && (
                      <div className="flex-shrink-0">
                        <img
                          src={`${baseUrl}${screen.image}`}
                          alt={screen.title}
                          className="h-40 w-auto object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null,
        )}
      </div>
    </div>
  )
}
