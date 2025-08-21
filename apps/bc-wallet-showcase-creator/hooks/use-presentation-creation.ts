import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { enableMapSet } from 'immer'
import { useEffect, useState } from 'react'
import { sampleAction } from '@/lib/steps'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { usePersonas } from './use-personas'
import type { Persona, PresentationScenarioRequest, Step, StepActionRequest, StepRequest } from 'bc-wallet-openapi'
import { StepActionType, StepType } from 'bc-wallet-openapi'
import { useShowcase } from './use-showcases'
import { presentationScenarioToPresentationScenarioRequest } from '@/lib/parsers'

enableMapSet()

type SelectedStep = {
  stepIndex: number
  scenarioIndex: number
} | null
interface PresentationCreationState {
  personaScenariosMap: Record<string, PresentationScenarioRequest[]>
  activePersonaId: string | null
  activeScenarioIndex: number
  stepState: 'editing-basic' | 'editing-issue' | 'no-selection' | 'creating-new' | 'editing-scenario'
  selectedScenarioId: string | null
  selectedStep: SelectedStep

  // Actions
  initializeWithScenarios: (scenariosMap: Record<string, PresentationScenarioRequest[]>) => void
  setActivePersonaId: (id: string | null) => void
  setActiveScenarioIndex: (index: number) => void
  updatePersonaSteps: (personaId: string, scenarioIndex: number, steps: StepRequest[]) => void
  addActionToStep: (personaId: string, stepIndex: number, action: StepActionRequest) => void
  addPersonaScenario: (persona: Persona, relayerId: string) => void
  duplicateScenario: (scenarioIndex: number) => void
  deleteScenario: (scenarioIndex: number) => void
  addStep: (personaId: string, scenarioIndex: number, stepData: StepRequest) => void
  updateStep: (personaId: string, scenarioIndex: number, stepIndex: number, stepData: StepRequest) => void
  deleteStep: (personaId: string, scenarioIndex: number, stepIndex: number) => void
  moveStep: (personaId: string, scenarioIndex: number, oldIndex: number, newIndex: number) => void
  duplicateStep: (personaId: string, scenarioIndex: number, stepIndex: number) => void
  setStepState: (
    state: 'editing-basic' | 'editing-issue' | 'no-selection' | 'creating-new' | 'editing-scenario',
  ) => void
  setSelectedScenarioId: (id: string | null) => void
  updateScenario: (personaId: string, scenarioIndex: number, scenarioData: PresentationScenarioRequest) => void
  removeScenario: (personaId: string, scenarioIndex: number) => void
  setSelectedStep: (selectedStep: SelectedStep) => void
  selectStep: (stepIndex: number, scenarioIndex: number) => void

  reset: () => void
}

const usePresentationCreationStore = create<PresentationCreationState>()(
  immer((set) => ({
    personaScenariosMap: {},
    activePersonaId: null as string | null,
    activeScenarioIndex: 0,
    stepState: 'no-selection' as PresentationCreationState['stepState'],
    selectedScenarioId: null as string | null,
    selectedStep: null as SelectedStep | null,

    initializeWithScenarios: (scenariosMap) =>
      set((state) => {
        state.personaScenariosMap = scenariosMap
        state.selectedStep = null
      }),

    setSelectedScenarioId: (id) =>
      set((state) => {
        state.selectedScenarioId = id
      }),

    setActivePersonaId: (id) =>
      set((state) => {
        state.activePersonaId = id
        state.activeScenarioIndex = 0
      }),

    setActiveScenarioIndex: (index) =>
      set((state) => {
        state.activeScenarioIndex = index
      }),

    updatePersonaSteps: (personaId, scenarioIndex, steps) =>
      set((state) => {
        if (!state.personaScenariosMap[personaId]) return

        const scenarios = state.personaScenariosMap[personaId]
        if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return

        scenarios[scenarioIndex].steps = steps
      }),

    addActionToStep: (personaId, stepIndex, action) =>
      set((state) => {
        if (!state.personaScenariosMap[personaId]) return

        const scenarios = state.personaScenariosMap[personaId]
        const scenarioIndex = state.activeScenarioIndex

        if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return

        const steps = scenarios[scenarioIndex].steps
        if (stepIndex < 0 || stepIndex >= steps.length) return

        const step = steps[stepIndex]
        steps[stepIndex] = {
          ...step,
          actions: [...(step.actions || []), action],
        }
      }),

    addPersonaScenario: (persona, relayerId) =>
      set((state) => {
        if (state.personaScenariosMap[persona.id]) return

        const defaultScenario: PresentationScenarioRequest = {
          name: "Add your student exam results",
          description: `Presentation scenario for ${persona.name}`,
          steps: [
            {
              title: `Scan the QR code to start sharing`,
              description: `Open the BC Wallet app and scan the QR code on the College website to start sharing your teacher credential with College Test.`,
              order: 0,
              type: 'HUMAN_TASK',
              actions: [{
                title: "Scan QR Code",
                actionType: StepActionType.SetupConnection,
                text: "Scan this QR code with your wallet to connect",
              }],
            },
            {
              title: `Confirm the information to send`,
              description: `BC Wallet will now ask you to confirm what to send. Notice how it will only share if the credential has not expired, not even the expiry date itself gets shared. You don't have to share anything else for it to be trustable.`,
              order: 1,
              type: 'SERVICE',
              actions: [sampleAction],
            },
            {
              title: `You are done!`,
              description: `You proved that you're a student, and you can now pass this online exam. It only took a few seconds, you revealed minimal information, and Test College could easily and automatically trust what you sent.`,
              order: 2,
              type: 'HUMAN_TASK',
              actions: [sampleAction],
            },
          ],
          personas: [persona.id],
          hidden: false,
          relyingParty: relayerId,
        }

        state.personaScenariosMap[persona.id] = [defaultScenario]
      }),

    duplicateScenario: (scenarioIndex) =>
      set((state) => {
        const personaId = state.activePersonaId
        if (!personaId || !state.personaScenariosMap[personaId]) return

        const scenarios = state.personaScenariosMap[personaId]
        if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return

        const scenarioToDuplicate = scenarios[scenarioIndex]
        const duplicatedScenario = JSON.parse(JSON.stringify(scenarioToDuplicate))

        duplicatedScenario.name = `${duplicatedScenario.name} (Copy)`
        duplicatedScenario.slug = null

        const newScenarioIndex = scenarios.length

        duplicatedScenario.steps = duplicatedScenario.steps.map((step: StepRequest, idx: number) => ({
          ...step,
          id: `step-${newScenarioIndex}-${idx}-${Date.now()}`,
          scenarioIndex: newScenarioIndex,
        }))

        return {
          personaScenariosMap: {
            ...state.personaScenariosMap,
            [personaId]: [...scenarios, duplicatedScenario],
          },
        }
        // scenarios.push(duplicatedScenario)
      }),

    addStep: (personaId, scenarioIndex, stepData) =>
      set((state) => {
        const existingScenarios = state.personaScenariosMap[personaId]
        if (!existingScenarios) return

        const scenarios = state.personaScenariosMap[personaId]
        if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return

        const currentSteps = scenarios[scenarioIndex].steps

        const newStep = {
          ...stepData,
          id: `step-${scenarioIndex}-${currentSteps.length}-${Date.now()}`,
          order: currentSteps.length,
          type: stepData.type || 'HUMAN_TASK',
          actions: stepData.actions || [],
        }

        scenarios[scenarioIndex].steps.push(newStep)
      }),

    updateStep: (personaId, scenarioIndex, stepIndex, stepData) =>
      set((state) => {
        if (!state.personaScenariosMap[personaId]) return

        const scenarios = state.personaScenariosMap[personaId]
        if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return

        const steps = scenarios[scenarioIndex].steps
        if (stepIndex < 0 || stepIndex >= steps.length) return

        steps[stepIndex] = {
          ...steps[stepIndex],
          ...stepData,
          order: stepIndex,
        }
      }),

    deleteStep: (personaId, scenarioIndex, stepIndex) =>
      set((state) => {
        if (!state.personaScenariosMap[personaId]) return

        const scenarios = state.personaScenariosMap[personaId]
        if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return

        const steps = scenarios[scenarioIndex].steps
        if (stepIndex < 0 || stepIndex >= steps.length) return

        // Remove the step
        steps.splice(stepIndex, 1)

        // Update orders for all steps
        steps.forEach((step, idx) => {
          step.order = idx
        })
      }),

    moveStep: (personaId, scenarioIndex, oldIndex, newIndex) =>
      set((state) => {
        if (!state.personaScenariosMap[personaId]) return

        const scenarios = state.personaScenariosMap[personaId]
        if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return

        const steps = scenarios[scenarioIndex].steps
        if (oldIndex < 0 || oldIndex >= steps.length || newIndex < 0 || newIndex >= steps.length) return

        const newSteps = [...steps]

        const [movedStep] = newSteps.splice(oldIndex, 1)

        newSteps.splice(newIndex, 0, movedStep)

        newSteps.forEach((step, idx) => {
          step.order = idx
        })

        scenarios[scenarioIndex].steps = newSteps
      }),

    duplicateStep: (personaId, scenarioIndex, stepIndex) =>
      set((state) => {
        if (!state.personaScenariosMap[personaId]) {
          console.log('No persona found with ID:', personaId)
          return
        }

        const scenarios = state.personaScenariosMap[personaId]
        if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) {
          console.log('Invalid scenario index:', scenarioIndex)
          return
        }

        const scenario = scenarios[scenarioIndex]
        const steps = scenario.steps

        if (stepIndex < 0 || stepIndex >= steps.length) {
          console.log('Invalid step index:', stepIndex)
          return
        }

        const stepToDuplicate = steps[stepIndex]

        const duplicatedStep = {
          ...JSON.parse(JSON.stringify(stepToDuplicate)),
          title: `${stepToDuplicate.title} (Copy)`,
          id: `step-${scenarioIndex}-${stepIndex}-${Date.now()}`,
          order: stepIndex + 1,
        }

        steps.splice(stepIndex + 1, 0, duplicatedStep)

        steps.forEach((step, idx) => {
          step.order = idx
        })
      }),

    deleteScenario: (scenarioIndex) =>
      set((state) => {
        const personaId = state.activePersonaId
        if (!personaId || !state.personaScenariosMap[personaId]) return

        const scenarios = state.personaScenariosMap[personaId]
        if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return

        scenarios.splice(scenarioIndex, 1)
      }),

    setStepState: (stepState) =>
      set((state) => {
        state.stepState = stepState
      }),

    updateScenario: (personaId, scenarioIndex, scenarioData) =>
      set((state) => {
        if (!state.personaScenariosMap[personaId]) return

        const scenarios = state.personaScenariosMap[personaId]
        if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return

        scenarios[scenarioIndex] = {
          ...scenarios[scenarioIndex],
          ...scenarioData,
        }
      }),

    removeScenario: (personaId, scenarioIndex) =>
      set((state) => {
        if (!state.personaScenariosMap[personaId]) return

        const scenarios = state.personaScenariosMap[personaId]
        if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return

        scenarios.splice(scenarioIndex, 1)

        if (state.activeScenarioIndex === scenarioIndex) {
          state.activeScenarioIndex = Math.max(0, scenarios.length - 1)
        } else if (state.activeScenarioIndex > scenarioIndex) {
          state.activeScenarioIndex--
        }
      }),

    setSelectedStep: (selectedStep) =>
      set((state) => {
        state.selectedStep = selectedStep
      }),

    selectStep: (stepIndex, scenarioIndex) =>
      set((state) => {
        state.selectedStep = { stepIndex, scenarioIndex }

        if (state.activeScenarioIndex !== scenarioIndex) {
          state.activeScenarioIndex = scenarioIndex
        }

        if (state.activePersonaId && state.personaScenariosMap[state.activePersonaId]) {
          const scenarios = state.personaScenariosMap[state.activePersonaId]

          if (scenarioIndex >= 0 && scenarioIndex < scenarios.length) {
            const steps = scenarios[scenarioIndex].steps

            if (stepIndex >= 0 && stepIndex < steps.length) {
              const currentStep = steps[stepIndex]

              if (currentStep.type === StepType.Service) {
                state.stepState = 'editing-basic'
              } else {
                state.stepState = 'editing-basic'
              }
            }
          }
        }
      }),

    reset: () => {
      set((state) => {
        state.personaScenariosMap = {}
        state.activePersonaId = null
        state.activeScenarioIndex = 0
      })
    },
  })),
)

export const usePresentationCreation = (showcaseSlug?: string) => {
  const { selectedPersonaIds } = useShowcaseStore()
  const { relayerId, selectedCredentialDefinitionIds } = useHelpersStore()
  const { data: personasData } = usePersonas()
  const { data: showcaseData, isLoading: isShowcaseLoading } = useShowcase(showcaseSlug || '')
  const [isInitialized, setIsInitialized] = useState(false)

  const {
    personaScenariosMap,
    activePersonaId,
    setActivePersonaId,
    activeScenarioIndex,
    setActiveScenarioIndex,
    updatePersonaSteps,
    addActionToStep,
    addPersonaScenario,
    duplicateScenario,
    deleteScenario,
    addStep,
    updateStep,
    deleteStep,
    moveStep,
    duplicateStep,
    setStepState,
    stepState,
    updateScenario,
    removeScenario,
    selectedScenarioId,
    setSelectedScenarioId,
    selectedStep,
    setSelectedStep,
    selectStep,
    initializeWithScenarios,
    reset,
  } = usePresentationCreationStore()

  useEffect(() => {
    if (showcaseSlug && showcaseData && !isShowcaseLoading && !isInitialized) {
      const showcase = showcaseData?.showcase

      if (showcase) {
        const issuanceScenarios = showcase.scenarios?.filter((scenario) => scenario.type === 'PRESENTATION') || []

        const personaScenariosData: Record<string, PresentationScenarioRequest[]> = {}
        
        if (issuanceScenarios.length === 0) {
          initializeWithScenarios(personaScenariosMap)
          setIsInitialized(true)
          return
        } else {
          issuanceScenarios.forEach((scenario) => {
            if (scenario.personas && scenario.personas.length > 0) {
              scenario.personas.forEach((persona) => {
                if (!personaScenariosData[persona.id]) {
                  personaScenariosData[persona.id] = []
                }

                const scenarioRequest = presentationScenarioToPresentationScenarioRequest(scenario)
                personaScenariosData[persona.id].push(scenarioRequest)
              })
            }
          })

          const mergedScenarios: Record<string, PresentationScenarioRequest[]> = { ...personaScenariosMap }

          for (const personaId in personaScenariosData) {
            const apiScenarios = personaScenariosData[personaId]
            const localScenarios = mergedScenarios[personaId] || []

            const mergedPersonaScenarios: PresentationScenarioRequest[] = []

            apiScenarios.forEach((apiScenario) => {
              const localMatch = localScenarios.find((local) => local.name === apiScenario.name)

              if (localMatch) {
                const apiStepKeys = new Set(apiScenario.steps?.map((s) => s.type + s.order))
                const extraLocalSteps = localMatch.steps?.filter((s) => !apiStepKeys.has(s.type + s.order)) || []

                mergedPersonaScenarios.push({
                  ...apiScenario,
                  steps: [...apiScenario.steps, ...extraLocalSteps],
                })
              } else {
                mergedPersonaScenarios.push(apiScenario)
              }
            })

            const extraLocalScenarios = localScenarios.filter(
              (local) => !apiScenarios.find((api) => api.name === local.name),
            )

            mergedScenarios[personaId] = [...mergedPersonaScenarios, ...extraLocalScenarios]
          }

          initializeWithScenarios(mergedScenarios)

          if (!activePersonaId && Object.keys(mergedScenarios).length > 0) {
            setActivePersonaId(Object.keys(mergedScenarios)[0])
          }

          setIsInitialized(true)
        }
      }
    }
  }, [
    showcaseSlug,
    showcaseData,
    isShowcaseLoading,
    isInitialized,
    initializeWithScenarios,
    activePersonaId,
    setActivePersonaId,
  ])

   useEffect(() => {
    if (showcaseSlug && isInitialized) return

    const personas = (personasData?.personas || []).filter((persona: Persona) =>
      selectedPersonaIds.includes(persona.id),
    )

    personas.forEach((persona: Persona) => {
      if (!personaScenariosMap[persona.id]) {
        addPersonaScenario(persona, relayerId)
      }
    })

    if (!activePersonaId && personas.length > 0) {
      setActivePersonaId(personas[0].id)
    }
  }, [
    showcaseSlug,
    isInitialized,
    personasData,
    selectedPersonaIds,
    personaScenariosMap,
    activePersonaId,
    relayerId,
    addPersonaScenario,
    setActivePersonaId,
  ])

  const selectedPersonas = (personasData?.personas || []).filter((persona: Persona) =>
    selectedPersonaIds.includes(persona.id),
  )

  const personaScenarios = new Map(Object.entries(personaScenariosMap))

  const selectedScenario =
    activePersonaId &&
    personaScenarios.has(activePersonaId) &&
    activeScenarioIndex >= 0 &&
    activeScenarioIndex < personaScenarios.get(activePersonaId)!.length
      ? personaScenarios.get(activePersonaId)![activeScenarioIndex]
      : null

  return {
    selectedPersonas,
    selectedCredentialDefinitionIds,
    personaScenarios,
    activePersonaId,
    setActivePersonaId,
    updatePersonaSteps: (personaId: string, steps: StepRequest[]) =>
      updatePersonaSteps(personaId, activeScenarioIndex, steps),
    addActionToStep: (personaId: string, stepIndex: number, action: StepActionRequest) =>
      addActionToStep(personaId, stepIndex, action),
    addPersonaScenario: (persona: Persona) => addPersonaScenario(persona, relayerId),
    duplicateScenario,
    activeScenarioIndex,
    setActiveScenarioIndex,
    deleteScenario,
    // steps
    addStep,
    updateStep,
    deleteStep,
    moveStep,
    duplicateStep,
    setStepState,
    stepState,
    selectedScenario,
    updateScenario: (scenarioData: PresentationScenarioRequest) =>
      activePersonaId && updateScenario(activePersonaId, activeScenarioIndex, scenarioData),
    removeScenario: () => activePersonaId && removeScenario(activePersonaId, activeScenarioIndex),
    selectedStep,
    setSelectedStep,
    selectStep,
    personaScenariosMap,
    isShowcaseLoading,
    isInitialized,
    reset,
  }
}
