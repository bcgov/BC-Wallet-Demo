import type { CustomCharacter, OnboardingStep } from '../types'

import { useState } from 'react'

import { baseUrl } from '../../client/api/BaseUrl'

import { EditScreenModal } from './EditScreenModal'
import { ScreenContentCard } from './ScreenContentCard'

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
              <ScreenContentCard
                screenId={screen.screenId}
                title={screen.title}
                text={screen.text}
                image={screen.image}
                credentials={screen.credentials}
                onEdit={() => handleEditClick(idx, screen)}
              />
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
