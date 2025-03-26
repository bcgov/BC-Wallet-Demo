'use client'

import { SortableStep } from '@/components/onboarding-screen/sortable-step'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { cn, ensureBase64HasPrefix } from '@/lib/utils'
import type { Persona } from '@/openapi-types'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useRouter } from '@/i18n/routing'

import { Button } from '../ui/button'
import { usePersonas } from '@/hooks/use-personas'
import { useShowcaseStore } from '@/hooks/use-showcases-store'

export const CreateOnboardingScreen = () => {
  const t = useTranslations()
  const { steps, selectedStep, moveStep, setStepState, personas, activePersonaId, setActivePersonaId, activePersona } =
    useOnboardingAdapter()
  const { selectedPersonaIds } = useShowcaseStore()
  const { data: personasData, isLoading } = usePersonas()
  const router = useRouter()
  console.log(personasData?.personas)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const oldIndex = steps.findIndex((step) => step.id === active.id)
    const newIndex = steps.findIndex((step) => step.id === over.id)

    if (oldIndex !== newIndex) {
      moveStep(oldIndex, newIndex)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    // Handle drag start if needed
  }


  return (
    <div className="bg-white dark:bg-dark-bg-secondary text-light-text dark:text-dark-text rounded-md border shadow-sm">
      {selectedPersonaIds.length === 0 ? (
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-4">No personas selected</h3>
          <p className="mb-4">You need to select personas before creating onboarding steps.</p>
          <Button variant="outlineAction" onClick={() => router.push('/showcases/create')}>
            {t('onboarding.go_back_to_select_personas')}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex bg-gray-100 rounded-t-md border-b">
            {personas.map((persona: Persona) => (
              <div
                key={persona.id}
                onClick={() => setActivePersonaId(persona.id)}
                className={cn(
                  'w-full p-4 text-center cursor-pointer transition-colors duration-200',
                  activePersonaId === persona.id
                    ? 'bg-white dark:bg-dark-bg shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                )}
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full mb-2 overflow-hidden">
                    <Image
                      src={
                        persona.headshotImage?.content
                          ? ensureBase64HasPrefix(persona.headshotImage.content)
                          : '/assets/NavBar/Joyce.png'
                      }
                      alt={`${persona.name} Headshot`}
                      width={50}
                      height={50}
                      className="rounded-full aspect-square object-cover"
                    />
                  </div>
                  <div className="text-lg font-semibold">{persona.name}</div>
                  <div className="text-sm text-gray-500">{persona.role}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-b w-full light-border dark:dark-border">
            <div className="p-4">
              <h2 className="text-base font-bold">{activePersona?.name || 'Persona'}'s Journey</h2>
              <p className="text-xs">
                {t('onboarding.editing_steps_message') || 'Configure the onboarding experience for this persona'}
              </p>
            </div>
          </div>

          <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map((step) => step.id)} strategy={verticalListSortingStrategy}>
              {steps.length === 0 ? (
                <div className="text-center text-gray-500 p-4">
                  <p>No steps created yet. Click the button below to add your first step.</p>
                </div>
              ) : (
                steps.map((step, index) => (
                  <div key={index} className="flex flex-row px-4 pt-4">
                    <SortableStep
                      selectedStep={selectedStep}
                      myScreen={step as any}
                      stepIndex={index + 1}
                      totalSteps={steps.length}
                    />
                  </div>
                ))
              )}

              <DragOverlay>
                {selectedStep !== null && steps[selectedStep] && (
                  <div className="top-1">
                    <p>{steps[selectedStep].title}</p>
                    <div className="highlight-container w-full flex flex-row justify-items-center items-center rounded p-3 unselected-item backdrop-blur">
                      <p className="text-sm">{steps[selectedStep].description}</p>
                    </div>
                  </div>
                )}
              </DragOverlay>
            </SortableContext>
          </DndContext>

          <div className="p-4 mt-auto border-t">
            <Button
              onClick={() => setStepState('creating-new')}
              className="w-full"
              variant="outlineAction"
              disabled={activePersonaId === null}
            >
              {t('onboarding.add_step_label') || 'Add Step'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
