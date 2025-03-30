'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useScenarios } from '@/hooks/use-scenarios'
import { useShowcaseStore } from '@/hooks/use-showcase-store'
import type { Persona } from '@/openapi-types'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { produce } from 'immer'
import { Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

import ButtonOutline from '../ui/button-outline'

export const ScenarioScreen = () => {
  const t = useTranslations()
  const { selectedCharacter } = useShowcaseStore()
  const {
    scenarios,
    setScenarios,
    editScenario,
    removeScenario,
    setStepState,
    moveStep,
    setSelectedScenario,
    selectedScenario,
  } = useScenarios()

  const Showcases = {
    showcase: {
      id: '123e4567-e89b-12d3-a456-426614174456',
      name: 'Credential Showcase BCGov',
      description: 'Collection of credential usage scenarios',
      status: 'PENDING',
      hidden: false,
      scenarios: [
        {
          id: '789e4567-e89b-12d3-a456-434314174123',
          name: 'Parking Permit',
          description: 'This scenario Presentation credentials to users',
          type: 'PRESENTATION',
          steps: [
            {
              id: '123e4567-e89b-12d3-a456-434314174000',
              title: 'Presentation Identity',
              description: "Presentation the user's identity",
              order: 1,
              type: 'HUMAN_TASK',
              subScenario: '123e4567-e89b-12d3-a456-434314174000',
              actions: [
                {
                  id: '123e4567-ef2d-12d3-abcd-426614174451',
                  title: 'Connect Wallet',
                  text: 'Connect your wallet to continue',
                  proofRequest: null,
                },
              ],
              asset: {
                id: '123e4567-e89b-12d3-a456-426614174469',
                mediaType: 'image/jpeg',
                content:
                  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAADMElEQVR4nOzVwQnAIBQFQYXff81RUkQCOyDj1YOPnbXWPmeTRef+/3O/OyBjzh3CD95BfqICMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMO0TAAD//2Anhf4QtqobAAAAAElFTkSuQmCC',
                fileName: 'asset.jpg',
                description: 'A beautiful image of a cat',
              },
            },
          ],
        },
        {
          id: '789e4567-e89b-12d3-a456-434314174126',
          name: 'Credential Issuance',
          description: 'This scenario issues credentials to users',
          type: 'PRESENTATION',
          steps: [
            {
              id: '123e4567-e89b-12d3-a456-434314174001',
              title: 'Verify Identity',
              description: "Verify the user's identity",
              order: 1,
              type: 'HUMAN_TASK',
              subScenario: '123e4567-e89b-12d3-a456-434314174003',
              actions: [
                {
                  id: '123e4567-ef2d-12d3-abcd-426614174454',
                  title: 'Connect Wallet1',
                  text: 'Connect your wallet to continue',
                  proofRequest: null,
                },
                {
                  id: '123e4567-ef2d-12d3-abcd-426614174455',
                  title: 'Download Wallet1',
                  text: 'Download your wallet to continue',
                  proofRequest: null,
                },
              ],
              asset: {
                id: '123e4567-e89b-12d3-a456-426614174461',
                mediaType: 'image/jpeg',
                content:
                  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAADMElEQVR4nOzVwQnAIBQFQYXff81RUkQCOyDj1YOPnbXWPmeTRef+/3O/OyBjzh3CD95BfqICMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMO0TAAD//2Anhf4QtqobAAAAAElFTkSuQmCC',
                fileName: 'asset.jpg',
                description: 'A beautiful image of a cat',
              },
            },
            {
              id: '123e4567-e89b-12d3-a456-434314174002',
              title: 'Download Wallet',
              description: 'Download Wallet to continue',
              order: 1,
              type: 'HUMAN_TASK',
              subScenario: '123e4567-e89b-12d3-a456-434314174004',
              actions: [
                {
                  id: '123e4567-ef2d-12d3-abcd-426614174456',
                  title: 'Connect Wallet',
                  text: 'Connect your wallet to continue',
                },
                {
                  id: '123e4567-ef2d-12d3-abcd-426614174452',
                  title: 'Download Wallet',
                  text: 'Download your wallet to continue',
                },
              ],
              asset: {
                id: '123e4567-e89b-12d3-a456-426614174466',
                mediaType: 'image/jpeg',
                content:
                  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAADMElEQVR4nOzVwQnAIBQFQYXff81RUkQCOyDj1YOPnbXWPmeTRef+/3O/OyBjzh3CD95BfqICMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMO0TAAD//2Anhf4QtqobAAAAAElFTkSuQmCC',
                fileName: 'asset.jpg',
                description: 'A beautiful image of a cat',
              },
            },
          ],
        },
      ]
    },
  }

  const Maindata = Showcases.showcase
  const Scenarios = Maindata.scenarios

  const scenarioData = Scenarios.map((item) => item)
  console.log('Scenario Data:', scenarioData)

  // Extract personas
  const personas = [] as Persona[]

  const [selectedPersonaId, setSelectedPersonaId] = useState()

  // Find the selected persona
  const selectedPersona = personas.find((p) => p.id === selectedPersonaId)
  console.log('selectedPersona', selectedPersona)

  // Find the scenario that includes this persona
  const SelectedScenario = scenarioData
  // .find((scenario) =>
    // scenario.personas.some((persona) => persona.id === selectedPersonaId)
  // )

  console.log('SelectedScenario ', SelectedScenario)

  // const Steps = SelectedScenario ? SelectedScenario.steps : []
  const Steps: any = []

  // console.log('Showcase JSON', showcaseJSON.personas[selectedCharacter].scenarios);

  // const initialScenarios = JSON.parse(
  //   JSON.stringify(STeps)
  // );

  const initialScenarios = useMemo(() => {
    return JSON.parse(
      // JSON.stringify(showcaseJSON.personas[selectedCharacter].scenarios)
      // JSON.stringify(scenarioData)
      JSON.stringify([SelectedScenario])
    )
    // return JSON.parse(
    //   JSON.stringify(STeps)
    // );
  }, [selectedCharacter, selectedPersonaId])
  // const initialScenarios = useMemo(() => {
  //   return JSON.parse(
  //     JSON.stringify(showcaseJSON.personas[selectedCharacter].scenarios)
  //   );
  //   // return JSON.parse(
  //   //   JSON.stringify(STeps)
  //   // );
  // },[selectedCharacter])

  useEffect(() => {
    setScenarios(initialScenarios)
    console.log('initialScenarios', initialScenarios)
  }, [initialScenarios, setScenarios])

  const handleAddScenario = () => {
    const newScenario = {
      id: Date.now().toString(),
      name: '',
      status: 'draft' as const,
      overview: {
        title: '',
        text: '',
        image: '',
      },
      summary: {
        title: '',
        text: '',
        image: '',
      },
      steps: [],
    }
    editScenario(scenarios.length)
    setScenarios([...scenarios, newScenario])
  }

  const HandleCopyScenario = (index: number) => {
    try {
      const { scenarios } = useScenarios.getState()

      if (!scenarios[index]) return

      const StepToCopy = scenarios[index]

      const newStep = JSON.parse(JSON.stringify(StepToCopy))
      newStep.id = `${Date.now()}` // Ensure a unique ID

      useScenarios.setState(
        produce((state) => {
          state.scenarios.splice(index + 1, 0, newStep)
          state.selectedScenario = index + 1
        })
      )
    } catch (error) {
      console.log('Error in HandleCopy scenario', error)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    // Get step index inside the scenario
    const oldStepIndex = scenarios[0]?.steps.findIndex((item) => item.id === active.id)
    const newStepIndex = scenarios[0]?.steps.findIndex((item) => item.id === over.id)

    if (oldStepIndex !== -1 && newStepIndex !== -1 && oldStepIndex !== newStepIndex) {
      moveStep(Number(selectedScenario), oldStepIndex, newStepIndex)
      setSelectedScenario(0) // Since there's only one scenario, always set it to 0
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    // const index = scenarios.findIndex(
    //   (screen) => screen.id === event.active.id
    // );

    // Find index inside nested `steps`
    const nestedIndex = scenarios.findIndex((sce) => sce.steps.findIndex((item) => item.id === event.active.id) !== -1)

    setSelectedScenario(nestedIndex)
  }

  // console.log('scenarios:', scenarios);
  return (
    <div className="bg-white dark:bg-dark-bg-secondary text-light-text dark:text-dark-text min-h-screen flex flex-col">
      <div className="flex bg-gray-100 rounded-md border-b">
        {personas &&
          (personas || []).map((char: Persona, index: number) => (
            <div
              key={char.id}
              // @ts-expect-error: TODO: fix this
              onClick={() => setSelectedPersonaId(char.id)}
              className={`w-1/2 p-4 text-center border ${
                index === 0 ? 'bg-white dark:bg-dark-bg shadow-md' : 'bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center">
                {/* Character Avatar Placeholder */}
                <div className="w-12 h-12 bg-gray-300 rounded-full mb-2">
                  <Image
                    src={char.headshotImage || '/assets/no-image.jpg'}
                    alt={char.name}
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                </div>

                <div className="text-lg font-semibold">{char.name}</div>
                <div className="text-sm text-gray-500">{char.role}</div>

                {/* Status Badge */}
                {/* {stepState == "none-selected" && (
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
              {t('onboarding.editing_steps_label', { name: selectedPersona?.name })}
            </h2>
            <p className="text-xs">{t('onboarding.editing_steps_message')}</p>
          </div>
        </div>
      </div>

      <div className="flex">
        <div className="flex-1">
          {scenarios.map(
            (scenario, index) => (
              console.log('loop scenario', scenario),
              (
                <div key={scenario.id} className="pb-2 border rounded-lg dark:border-dark-border overflow-hidden flex">
                  <div
                    onClick={() => HandleCopyScenario(index)}
                    className="w-12 bg-[#3A3B3B] flex justify-center items-center"
                  >
                    <Copy className="h-6 w-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <div onClick={() => setStepState('editing-scenario')} className="p-3 bg-light-bg dark:bg-dark-bg">
                      {/* <h3 className="text-xl font-bold">{SelectedScenario?.name}</h3> */}
                    </div>

                    {/* Steps Section */}
                    <div className="p-2">
                      <DndContext
                        key={index}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={scenario.steps.map((step) => step.id)}
                          strategy={verticalListSortingStrategy}
                          key={scenario.id}
                        >
                          {scenario.steps.map((step, stepIndex) => (
                            <div key={step.id}>
                              {/* {step.actions.map((action, actionIndex) => ( */}
                              {/* <ScenarioStep
                                key={step.id} // Ensure each action has a unique key
                                step={step} // Pass action directly
                                stepIndex={stepIndex}
                                // @ts-expect-error: TODO: fix this
                                actionIndex={stepIndex as unknown as number} // Optional if needed
                                scenarioIndex={index}
                                totalSteps={scenario.steps.length}
                              /> */}
                              {/* ))} */}
                            </div>
                          ))}

                          {/* <DragOverlay>
                            {SelectedScenario !== null && (
                              <div className="top-1">
                                <p>{Steps.map((item) => item.title)}</p>
                                <div className="highlight-container w-full flex flex-row justify-items-center items-center rounded p-3 unselected-item backdrop-blur">
                                  <p className="text-sm">{Steps.map((item) => item.description)}</p>
                                </div>
                              </div>
                            )}
                          </DragOverlay> */}
                        </SortableContext>
                      </DndContext>

                      <div className="mt-4 flex justify-end">
                        <ButtonOutline
                          onClick={() => {
                            setStepState('adding-step')
                          }}
                        >
                          {t('scenario.add_step_label')}
                        </ButtonOutline>
                      </div>
                    </div>
                    <div className="p-5 bg-light-bg dark:bg-dark-bg">
                      <Button variant="destructive" onClick={() => removeScenario(index)}>
                        {t('scenario.delete_scenario_label')}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
      <div className="p-4 mt-auto">
        <ButtonOutline
          className="w-full"
          onClick={() => {
            handleAddScenario()
            // setStepState("editing-scenario");
            // window.scrollTo({ top: 200, behavior: "smooth" });
          }}
        >
          {t('scenario.add_scenario_label').toUpperCase()}
        </ButtonOutline>
      </div>
    </div>
  )
}
