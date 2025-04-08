import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { enableMapSet } from 'immer'
import { useEffect } from 'react'
import type { StepRequestType, AriesOOBActionRequest, PresentationScenarioRequestType } from '@/openapi-types'
import { sampleAction } from '@/lib/steps'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { usePersonas } from './use-personas'
import type { Persona } from 'bc-wallet-openapi'
import { StepType } from '@/types'

enableMapSet()

type SelectedStep = {
  stepIndex: number
  scenarioIndex: number
} | null
interface PresentationCreationState {
  personaScenariosMap: Record<string, PresentationScenarioRequestType[]>
  activePersonaId: string | null
  activeScenarioIndex: number
  stepState: 'editing-basic' | 'editing-issue' | 'no-selection' | 'creating-new' | 'editing-scenario'
  selectedScenarioId: string | null
  selectedStep: SelectedStep

  // Actions
  setActivePersonaId: (id: string | null) => void
  setActiveScenarioIndex: (index: number) => void
  updatePersonaSteps: (personaId: string, scenarioIndex: number, steps: StepRequestType[]) => void
  addActionToStep: (personaId: string, stepIndex: number, action: typeof AriesOOBActionRequest._type) => void
  addPersonaScenario: (persona: Persona, relayerId: string) => void
  duplicateScenario: (scenarioIndex: number) => void
  deleteScenario: (scenarioIndex: number) => void
  addStep: (personaId: string, scenarioIndex: number, stepData: StepRequestType) => void
  updateStep: (personaId: string, scenarioIndex: number, stepIndex: number, stepData: StepRequestType) => void
  deleteStep: (personaId: string, scenarioIndex: number, stepIndex: number) => void
  moveStep: (personaId: string, scenarioIndex: number, oldIndex: number, newIndex: number) => void
  duplicateStep: (personaId: string, scenarioIndex: number, stepIndex: number) => void
  setStepState: (
    state: 'editing-basic' | 'editing-issue' | 'no-selection' | 'creating-new' | 'editing-scenario',
  ) => void
  setSelectedScenarioId: (id: string | null) => void
  updateScenario: (personaId: string, scenarioIndex: number, scenarioData: PresentationScenarioRequestType) => void
  removeScenario: (personaId: string, scenarioIndex: number) => void
  setSelectedStep: (selectedStep: SelectedStep) => void
  selectStep: (stepIndex: number, scenarioIndex: number) => void
}

const usePresentationCreationStore = create<PresentationCreationState>()(
  immer((set) => ({
    personaScenariosMap: {},
    activePersonaId: null as string | null,
    activeScenarioIndex: 0,
    stepState: 'no-selection' as PresentationCreationState['stepState'],
    selectedScenarioId: null as string | null,
    selectedStep: null as SelectedStep | null,

    setSelectedScenarioId: (id) =>
      set((state) => {
        state.selectedScenarioId = id
      }),

    setActivePersonaId: (id) =>
      set((state) => {
        state.activePersonaId = id
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

        const defaultScenario: PresentationScenarioRequestType = {
          name: "You're done!",
          description: `Presentation scenario for ${persona.name}`,
          type: 'PRESENTATION',
          steps: [
            {
              title: `Scan the QR Code to start sharing`,
              description: `Imagine, as Ana, you are logged into the BestBC College website (see below). They want to offer you a Digital Student Card. Use your BC Wallet to scan the QR code from the website.`,
              order: 0,
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

        const newScenarioIndex = scenarios.length

        duplicatedScenario.steps = duplicatedScenario.steps.map((step: StepRequestType, idx: number) => ({
          ...step,
          id: `step-${newScenarioIndex}-${idx}-${Date.now()}`,
          scenarioIndex: newScenarioIndex,
        }))

        scenarios.push(duplicatedScenario)
      }),

    addStep: (personaId, scenarioIndex, stepData) =>
      set((state) => {
        if (!state.personaScenariosMap[personaId]) return

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
        console.log('Duplicating step with:', { personaId, scenarioIndex, stepIndex })

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

    // selectStep: (stepIndex, scenarioIndex) =>
    //   set((state) => {
    //     state.selectedStep = { stepIndex, scenarioIndex }
    //     state.activeScenarioIndex = scenarioIndex

    //     if (state.activePersonaId && state.personaScenariosMap[state.activePersonaId]) {
    //       const scenarios = state.personaScenariosMap[state.activePersonaId]

    //       if (scenarioIndex >= 0 && scenarioIndex < scenarios.length) {
    //         const steps = scenarios[scenarioIndex].steps

    //         if (stepIndex >= 0 && stepIndex < steps.length) {
    //           const currentStep = steps[stepIndex]

    //           state.stepState = currentStep.type === 'SERVICE' ? 'editing-issue' : 'editing-basic'
    //         }
    //       }
    //     }
    //   }),

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

              if (currentStep.type === StepType.SERVICE) {
                state.stepState = 'editing-issue'
              } else {
                state.stepState = 'editing-basic'
              }
            }
          }
        }
      }),

    // addStep: (personaId, scenarioIndex, stepData) =>
    //   set((state) => {
    //     if (!state.personaScenariosMap[personaId]) return

    //     const scenarios = state.personaScenariosMap[personaId]
    //     if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return

    //     const currentSteps = scenarios[scenarioIndex].steps

    //     const newStep = {
    //       ...stepData,
    //       id: `step-${scenarioIndex}-${currentSteps.length}-${Date.now()}`,
    //       order: currentSteps.length,
    //       type: stepData.type || 'HUMAN_TASK',
    //       actions: stepData.actions || [],
    //     }

    //     scenarios[scenarioIndex].steps.push(newStep)

    //     state.selectedStep = {
    //       stepIndex: currentSteps.length,
    //       scenarioIndex,
    //     }
    //   }),

    // deleteStep: (personaId, scenarioIndex, stepIndex) =>
    //   set((state) => {
    //     if (!state.personaScenariosMap[personaId]) return

    //     const scenarios = state.personaScenariosMap[personaId]
    //     if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return

    //     const steps = scenarios[scenarioIndex].steps
    //     if (stepIndex < 0 || stepIndex >= steps.length) return

    //     steps.splice(stepIndex, 1)

    //     steps.forEach((step, idx) => {
    //       step.order = idx
    //     })

    //     if (
    //       state.selectedStep &&
    //       state.selectedStep.scenarioIndex === scenarioIndex &&
    //       state.selectedStep.stepIndex === stepIndex
    //     ) {

    //       state.selectedStep = null
    //       state.stepState = 'no-selection'
    //     } else if (
    //       state.selectedStep &&
    //       state.selectedStep.scenarioIndex === scenarioIndex &&
    //       state.selectedStep.stepIndex > stepIndex
    //     ) {

    //       state.selectedStep = {
    //         ...state.selectedStep,
    //         stepIndex: state.selectedStep.stepIndex - 1,
    //       }
    //     }
    //   }),
  })),
)

export const usePresentationCreation = () => {
  const { selectedPersonaIds } = useShowcaseStore()
  const { relayerId, selectedCredentialDefinitionIds } = useHelpersStore()
  const { data: personasData } = usePersonas()

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
  } = usePresentationCreationStore()

  useEffect(() => {
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
    updatePersonaSteps,
    addActionToStep,
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
    updateScenario: (scenarioData: PresentationScenarioRequestType) =>
      activePersonaId && updateScenario(activePersonaId, activeScenarioIndex, scenarioData),
    removeScenario: () => activePersonaId && removeScenario(activePersonaId, activeScenarioIndex),
    selectedStep,
    setSelectedStep,
    selectStep,
  }
}
