import type { CustomCharacter, UseCaseScreen } from '../types'

import { useEffect, useState } from 'react'

import { EditScreenModal } from './EditScreenModal'
import { ScreenContentCard } from './ScreenContentCard'

interface ScenariosTabProps {
  character: CustomCharacter | null
}

export function ScenariosTab({ character }: ScenariosTabProps) {
  const [activeUseCase, setActiveUseCase] = useState<string | null>(null)
  const [editingScreenIdx, setEditingScreenIdx] = useState<number | null>(null)
  const [editingScreen, setEditingScreen] = useState<UseCaseScreen | null>(null)

  useEffect(() => {
    if (character?.useCases?.length) {
      setActiveUseCase(character.useCases[0].id)
    }
  }, [character?.useCases])

  const handleEditClick = (idx: number, screen: UseCaseScreen) => {
    setEditingScreenIdx(idx)
    setEditingScreen(screen)
  }

  const handleSaveScreen = (updatedScreen: UseCaseScreen) => {
    if (!character || editingScreenIdx === null) return

    // TODO: Call API to save changes to the character
    // eslint-disable-next-line no-console
    console.log('Saving updated screen:', updatedScreen)

    setEditingScreenIdx(null)
    setEditingScreen(null)
  }

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
                <ScreenContentCard
                  key={idx}
                  screenId={screen.screenId}
                  title={screen.title}
                  text={screen.text}
                  image={screen.image}
                  onEdit={() => handleEditClick(idx, screen)}
                  containerClassName="border border-gray-300 rounded-lg bg-white p-8 mb-6 relative flex items-center justify-between gap-6"
                  textMarginClass=""
                />
              ))}
            </div>
          ) : null,
        )}
      </div>

      <EditScreenModal
        isOpen={editingScreenIdx !== null}
        onClose={() => {
          setEditingScreenIdx(null)
          setEditingScreen(null)
        }}
        screen={editingScreen as any}
        progressBar={null}
        character={character}
        onSave={(updatedScreen) => handleSaveScreen(updatedScreen as UseCaseScreen)}
      />
    </div>
  )
}
