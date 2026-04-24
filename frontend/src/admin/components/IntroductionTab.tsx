import type { CustomCharacter, OnboardingStep } from '../types'

import { CreditCardIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

import { baseUrl } from '../../client/api/BaseUrl'

import { EditScreenModal } from './EditScreenModal'

interface ProgressBar {
  name: string
  onboardingStep: string
  iconLight: string
  iconDark: string
}

interface IntroductionTabProps {
  character: CustomCharacter | null
}

export function IntroductionTab({ character }: IntroductionTabProps) {
  const [editingScreenIdx, setEditingScreenIdx] = useState<number | null>(null)
  const [editingScreen, setEditingScreen] = useState<OnboardingStep | null>(null)
  const [editingProgressBar, setEditingProgressBar] = useState<ProgressBar | null>(null)

  const handleEditClick = (idx: number, screen: OnboardingStep) => {
    const progressStep = character?.progressBar?.find((p) => p.onboardingStep === screen.screenId)
    setEditingScreenIdx(idx)
    setEditingScreen(screen)
    setEditingProgressBar(progressStep || null)
  }

  const handleSaveScreen = (updatedScreen: OnboardingStep, updatedProgressBar?: ProgressBar) => {
    if (!character || editingScreenIdx === null) return

    // Update the onboarding screen
    const updatedCharacter = { ...character }
    if (updatedCharacter.onboarding && editingScreenIdx < updatedCharacter.onboarding.length) {
      updatedCharacter.onboarding[editingScreenIdx] = updatedScreen
    }

    // Update the progress bar if provided
    if (updatedProgressBar && updatedCharacter.progressBar) {
      const progressIdx = updatedCharacter.progressBar.findIndex((p) => p.onboardingStep === updatedScreen.screenId)
      if (progressIdx >= 0) {
        updatedCharacter.progressBar[progressIdx] = updatedProgressBar
      }
    }

    // TODO: Call API to save changes to the character
    console.log('Updated character:', updatedCharacter)

    setEditingScreenIdx(null)
    setEditingScreen(null)
    setEditingProgressBar(null)
  }
  return (
    <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
      {/* Introduction Tab */}
      <div className="w-full max-w-6xl mb-8 px-6">
        <h2 className="text-2xl font-semibold text-bcgov-black">Introduction Screens</h2>
        <h5 className="text-gray-500 mt-2">Configure the introduction screens.</h5>
      </div>
      <div className="w-full max-w-6xl px-6 space-y-6">
        {character?.onboarding?.map((screen, idx) => {
          const progressStep = character?.progressBar?.find((p) => p.onboardingStep === screen.screenId)
          return (
            <div key={idx} className="flex gap-6 items-center">
              {/* Progress Icon */}
              <div className="flex-shrink-0 flex flex-col items-center">
                {progressStep ? (
                  <>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-bcgov-blue bg-blue-50">
                      <img src={`${baseUrl}${progressStep.iconLight}`} alt={progressStep.name} className="w-6 h-6" />
                    </div>
                  </>
                ) : (
                  <div className="w-12 h-12" />
                )}
              </div>

              {/* Screen Content */}
              <div className="flex-1 border border-gray-300 rounded-lg bg-white p-8 flex items-center justify-between gap-6 relative">
                <button
                  onClick={() => handleEditClick(idx, screen)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-bcgov-blue transition-colors"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <p className="text-sm font-bold text-bcgov-black mb-2">
                    {screen.screenId
                      .replace(/_/g, ' ')
                      .split(' ')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(' ')}
                  </p>
                  <p className="text-xs font-semibold text-bcgov-black mb-1">{screen.title}</p>
                  <p className="text-xs text-gray-600 mb-3">{screen.text}</p>
                  {screen.credentials && screen.credentials.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {screen.credentials.map((cred, credIdx) => (
                        <div
                          key={credIdx}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                        >
                          <CreditCardIcon className="w-3 h-3" />
                          {cred.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {screen.image && (
                  <div className="flex-shrink-0">
                    <img src={`${baseUrl}${screen.image}`} alt={screen.title} className="h-40 w-auto object-contain" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <EditScreenModal
        isOpen={editingScreenIdx !== null}
        onClose={() => {
          setEditingScreenIdx(null)
          setEditingScreen(null)
          setEditingProgressBar(null)
        }}
        screen={editingScreen}
        progressBar={editingProgressBar}
        character={character}
        onSave={handleSaveScreen}
      />
    </div>
  )
}
