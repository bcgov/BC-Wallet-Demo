'use client'

import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { cn, ensureBase64HasPrefix } from '@/lib/utils'
import type { Persona, ScenarioRequestType, StepRequestType } from '@/openapi-types'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useRouter } from '@/i18n/routing'

import { Button } from '../ui/button'
import { SortableStep } from './sortable-step'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { Copy } from 'lucide-react'

export const CreateScenariosScreen = () => {
  const t = useTranslations()
  const {
    steps,
    selectedStep,
    moveStep,
    setStepState,
    personas,
    activePersonaId,
    setActivePersonaId,
    scenarios,
    duplicateScenario,
    setActiveScenarioIndex,
    activeScenarioIndex,
    deleteScenario,
  } = usePresentationAdapter()
  const { selectedPersonaIds } = useShowcaseStore()
  const router = useRouter()

  // const handleDragEnd = (event: DragEndEvent) => {
  //   const { active, over } = event
  //   if (!over) return

  //   const oldIndex = steps.findIndex((step) => step.id === active.id)
  //   const newIndex = steps.findIndex((step) => step.id === over.id)

  //   if (oldIndex !== newIndex) {
  //     moveStep(oldIndex, newIndex)
  //   }
  // }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    // Extract the stepIndex from the ID format "step-scenarioIndex-stepIndex"
    const activeIdParts = active.id.toString().split('-')
    const overIdParts = over.id.toString().split('-')

    // Ensure we have valid IDs
    if (activeIdParts.length >= 3 && overIdParts.length >= 3) {
      const oldIndex = parseInt(activeIdParts[2])
      const newIndex = parseInt(overIdParts[2])

      if (oldIndex !== newIndex) {
        moveStep(oldIndex, newIndex)
      }
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    // Handle drag start if needed
  }

  const handleScenarioClick = (index: number) => {
    if (activePersonaId) {
      duplicateScenario(index)
    }
  }

  const handleScenarioDelete = (index: number) => {
    deleteScenario(index)
  }

  // Get the current active scenario's steps
  const activeScenario = scenarios[activeScenarioIndex]
  const currentSteps = activeScenario?.steps || []

  return (
    <div className="bg-white dark:bg-dark-bg-secondary text-light-text dark:text-dark-text rounded-md border shadow-sm">
      {selectedPersonaIds.length === 0 ? (
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-4">No personas selected</h3>
          <p className="mb-4">You need to select personas before creating onboarding steps.</p>
          <Button variant="outlineAction" onClick={() => router.push('/showcases/create')}>
            Go Back to Select Personas
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
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600',
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

          <div className="p-4">
            <div className="border-b w-full light-border dark:dark-border">
              <div className="pb-4">
                <h2 className="text-base font-bold">You are editing Ana's scenario.</h2>
                <p className="text-xs">{t('onboarding.editing_steps_message')}</p>
              </div>
            </div>

            {scenarios.map((scenario: ScenarioRequestType, index: number) => (
              <div
                key={index}
                className={cn(
                  'border cursor-pointer rounded-lg dark:border-dark-border overflow-hidden flex mb-2',
                  activeScenarioIndex === index ? 'border-2 border-primary' : '',
                )}
              >
                <div
                  onClick={() => handleScenarioClick(index)}
                  className="w-12 bg-[#3A3B3B] flex justify-center items-center cursor-pointer hover:bg-[#4A4B4B]"
                >
                  <Copy className="h-6 w-6 text-white" />
                </div>

                <div className="flex-1 gap-4">
                  <div
                    onClick={() => {
                      setActiveScenarioIndex(index)
                      setStepState('editing-scenario')
                    }}
                    className="p-3 bg-light-bg dark:bg-dark-bg"
                  >
                    <h3 className="text-xl font-bold">{scenario?.name}</h3>
                  </div>

                  {/* Only show steps for the active scenario */}
                  {/* {activeScenarioIndex === index && ( */}
                  <>
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="p-2">
                        <SortableContext
                          items={scenario.steps?.map((step, i) => `step-${index}-${i}`)}
                          strategy={verticalListSortingStrategy}
                        >
                          {!scenario.steps || scenario.steps.length === 0 ? (
                            <div className="text-center text-gray-500 p-4">
                              <p>No steps created yet. Click the button below to add your first step.</p>
                            </div>
                          ) : (
                            scenario.steps.map((step: StepRequestType, stepIndex: number) => {
                              console.log('step ==>', step)
                              return (
                                <div key={`step-${index}-${stepIndex}`} className="flex flex-row">
                                  <SortableStep
                                    selectedStep={selectedStep}
                                    myScreen={step as any}
                                    stepIndex={stepIndex + 1}
                                    totalSteps={scenario.steps.length}
                                    scenarioIndex={index}
                                  />
                                </div>
                              )
                            })
                          )}

                          <DragOverlay>
                            {selectedStep !== null && scenario.steps && scenario.steps[selectedStep] && (
                              <div className="top-1">
                                <p>{scenario.steps[selectedStep].title}</p>
                                <div className="highlight-container w-full flex flex-row justify-items-center items-center rounded p-3 unselected-item backdrop-blur">
                                  <p className="text-sm">{scenario.steps[selectedStep].description}</p>
                                </div>
                              </div>
                            )}
                          </DragOverlay>
                        </SortableContext>
                      </div>
                    </DndContext>

                    <div className="p-2 pt-0 flex flex-row gap-2">
                      <Button
                        onClick={() => setStepState('creating-new')}
                        variant="outlineAction"
                        disabled={activePersonaId === null}
                      >
                        {t('onboarding.add_step_label')}
                      </Button>

                      <Button
                        onClick={() => handleScenarioDelete(index)}
                        variant="outlineAction"
                        disabled={activePersonaId === null}
                      >
                        {t('scenario.remove_scenario_label').toUpperCase()}
                      </Button>
                    </div>
                  </>
                  {/* )} */}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t">
              <Button
                onClick={() => setStepState('creating-new')}
                className="w-full"
                variant="outlineAction"
                disabled={activePersonaId === null}
              >
                {t('scenario.add_scenario_label').toUpperCase() || 'Add Scenario'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
