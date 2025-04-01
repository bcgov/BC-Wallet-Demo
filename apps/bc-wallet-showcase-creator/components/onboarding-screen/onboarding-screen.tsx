// @ts-nocheck
'use client'

import { useEffect, useMemo, useState } from 'react'

import { ErrorModal } from '@/components/error-modal'
import { SortableStep } from '@/components/onboarding-screen/sortable-step'
import ButtonOutline from '@/components/ui/button-outline'
import { useIssuanceStep, useOnboarding } from '@/hooks/use-onboarding'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { ensureBase64HasPrefix } from '@/lib/utils'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

export const OnboardingScreen = ({ slug }: { slug: string }) => {
  const t = useTranslations()
  const { screens, selectedStep, initializeScreens, setSelectedStep, moveStep, setStepState } = useOnboarding()

  const { displayShowcase } = useShowcaseStore()
  const personas = displayShowcase.personas || []
  const { data, isLoading } = useIssuanceStep(slug)
  const [showErrorModal, setErrorModal] = useState(false)
  let InitialId = personas.length > 0 ? personas[0]?.id : ''
  const [selectedPersonaId, setSelectedPersonaId] = useState(InitialId)

  // Find the selected persona
  const selectedPersona = personas.find((p: any) => p.id === selectedPersonaId) || null

  // const Steps = data ? data?.steps : [];
  const Steps = []

  const initialScreens = useMemo(() => {
    return JSON.parse(JSON.stringify(Steps))
  }, [data])

  useEffect(() => {
    initializeScreens(JSON.parse(JSON.stringify(Steps)))
  }, [initialScreens, initializeScreens])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const oldIndex = screens.findIndex((screen) => screen.id === active.id)
    const newIndex = screens.findIndex((screen) => screen.id === over.id)

    if (oldIndex !== newIndex) {
      moveStep(oldIndex, newIndex)
      setSelectedStep(newIndex)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const index = screens.findIndex((screen) => screen.id === event.active.id)
    setSelectedStep(index)
  }

  return (
    <>
      {showErrorModal && <ErrorModal errorText="Unknown error occurred" setShowModal={setErrorModal} />}
      <>
        {isLoading && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            Loading Scenario
          </div>
        )}
        <div className="bg-white dark:bg-dark-bg-secondary text-light-text dark:text-dark-text">
          <div className="flex bg-gray-100 rounded-md border-b">
            {/* {Data && Data.issuanceFlow.personas?.map((char: any, index: number) => ( */}
            {personas &&
              personas?.map((char: any, index: number) => (
                <div
                  key={char.id}
                  onClick={() => setSelectedPersonaId(char.id)}
                  className={`w-full p-4 text-center border ${
                    index === 0 ? 'bg-white dark:bg-dark-bg shadow-md' : 'bg-gray-200'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full mb-2">
                      <Image
                        // src={char.headshotImage.content}
                        src={ensureBase64HasPrefix(char.headshotImage?.content) || '/assets/no-image.jpg'}
                        alt={char.name}
                        width={50}
                        height={50}
                        className="rounded-full aspect-square object-cover"
                      />
                    </div>

                    <div className="text-lg font-semibold">{char.name}</div>
                    <div className="text-sm text-gray-500">{char.role}</div>

                    {/* {stepState == "no-selection" && (
                  <div className="w-full mt-2 px-3 py-1 bg-yellow-400 text-xs font-semibold rounded">
                    Incomplete
                  </div>
                )} */}
                  </div>
                </div>
              ))}
          </div>

          <div className="flex flex-cols">
            <div className="border-b w-full light-border dark:dark-border">
              <div className="p-4">
                <h2 className="text-base font-bold">
                  {t('onboarding.editing_steps_label', {
                    name: selectedPersona?.name,
                  })}
                  {/* {t("onboarding.editing_steps_label", { name: "Ana" })} */}
                </h2>
                <p className="text-xs">{t('onboarding.editing_steps_message')}</p>
              </div>
            </div>
          </div>

          <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={screens.map((screen) => screen.id)} strategy={verticalListSortingStrategy}>
              {screens.map((screen, index) => (
                <div key={screen.id} className="flex flex-row">
                  <SortableStep
                    selectedStep={selectedStep}
                    myScreen={screen}
                    stepIndex={index + 1}
                    totalSteps={screens.length}
                  />
                </div>
              ))}

              <DragOverlay>
                {selectedStep !== null && Steps[selectedStep] && (
                  <div className="top-1">
                    <p>{Steps[selectedStep].title}</p>
                    <div className="highlight-container w-full flex flex-row justify-items-center items-center rounded p-3 unselected-item backdrop-blur">
                      <p className="text-sm">{Steps[selectedStep].description}</p>
                    </div>
                  </div>
                )}
              </DragOverlay>
            </SortableContext>
          </DndContext>
        </div>

        <div className="p-4 mt-auto pt-10">
          <ButtonOutline
            onClick={() => {
              setStepState('creating-new')
              window.scrollTo({ top: 200, behavior: 'smooth' })
            }}
            className="w-full"
          >
            {t('onboarding.add_step_label')}
          </ButtonOutline>
        </div>
      </>
    </>
  )
}
