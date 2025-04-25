import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { enableMapSet } from 'immer'
import type { Persona, IssuanceScenarioRequest, StepActionRequest } from 'bc-wallet-openapi'
import { StepActionType } from 'bc-wallet-openapi'
import { Screen } from '@/types'

enableMapSet()

interface OnboardingCreationState {
  personaScenariosMap: Record<string, IssuanceScenarioRequest[]>
  activePersonaId: string | null
  activeScenarioIndex: number
  stepState: 'editing-basic' | 'editing-issue' | 'no-selection' | 'creating-new' | 'editing-scenario' | 'editing-connect' | 'editing-wallet'
  selectedScenarioId: string | null
  selectedStep: Screen | null
  // Actions
  initializeWithScenarios: (scenariosMap: Record<string, IssuanceScenarioRequest[]>) => void

  setActivePersonaId: (id: string | null) => void
  setActiveScenarioIndex: (index: number) => void
  updatePersonaSteps: (personaId: string, scenarioIndex: number, steps: Screen[]) => void
  addActionToStep: (personaId: string, scenarioIndex: number, stepIndex: number, action: StepActionRequest) => void
  addPersonaScenario: (persona: Persona, issuerId: string) => void
  duplicateScenario: (scenarioIndex: number) => void
  deleteScenario: (scenarioIndex: number) => void
  addStep: (personaId: string, scenarioIndex: number, stepData: Screen) => void
  updateStep: (personaId: string, scenarioIndex: number, stepIndex: number, stepData: Screen) => void
  deleteStep: (personaId: string, scenarioIndex: number, stepIndex: number) => void
  moveStep: (personaId: string, scenarioIndex: number, oldIndex: number, newIndex: number) => void
  duplicateStep: (personaId: string, scenarioIndex: number, stepIndex: number) => void
  setStepState: (
    state: 'editing-basic' | 'editing-issue' | 'no-selection' | 'creating-new' | 'editing-scenario' | 'editing-connect' | 'editing-wallet',
  ) => void
  setSelectedScenarioId: (id: string | null) => void
  updateScenario: (personaId: string, scenarioIndex: number, scenarioData: IssuanceScenarioRequest) => void
  removeScenario: (personaId: string, scenarioIndex: number) => void
  setSelectedStep: (selectedStep: Screen | null) => void
  selectStep: (stepIndex: number, scenarioIndex: number) => void
}

// Helper function to determine step state based on action type
const getStepStateFromAction = (step: Screen): OnboardingCreationState['stepState'] => {
  if (!step) return 'no-selection';
  
  if (!step.actions || step.actions.length === 0) {
    return 'editing-basic';
  }
  
  const actionType = step.actions[0].actionType;
  
  switch (actionType) {
    case StepActionType.ChooseWallet:
      return 'editing-wallet';
    case StepActionType.SetupConnection:
    case StepActionType.AriesOob:
      return 'editing-connect';
    case StepActionType.AcceptCredential:
      return 'editing-issue';
    default:
      return 'editing-basic';
  }
};

export const useOnboardingCreationStore = create<OnboardingCreationState>()(
  immer((set) => ({
    personaScenariosMap: {},
    activePersonaId: null as string | null,
    activeScenarioIndex: 0,
    stepState: 'no-selection' as OnboardingCreationState['stepState'],
    selectedScenarioId: null as string | null,
    selectedStep: null as Screen | null,

    // Add to the store actions
initializeWithScenarios: (scenariosMap) =>
  set((state) => {
    // Replace the entire map with the loaded data
    state.personaScenariosMap = scenariosMap
    
    // Reset other state as needed
    state.stepState = 'no-selection'
    state.selectedStep = null
  }),

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

    addActionToStep: (personaId, scenarioIndex, stepIndex, action) =>
      set((state) => {
        if (!state.personaScenariosMap[personaId]) return

        const scenarios = state.personaScenariosMap[personaId]
        if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return

        const steps = scenarios[scenarioIndex].steps
        if (stepIndex < 0 || stepIndex >= steps.length) return

        const step = steps[stepIndex]
        steps[stepIndex] = {
          ...step,
          actions: [...(step.actions || []), action],
        }
      }),

    addPersonaScenario: (persona, issuerId) =>
      set((state) => {
        if (state.personaScenariosMap[persona.id]) return

        const defaultOnboarding: IssuanceScenarioRequest = {
          name: "Get your student credential",
          description: `Issuance scenario for ${persona.name}`,
          steps: [
            {
              title: `Meet ${persona.name}`,
              description: `Welcome to this showcase. Here you'll learn about digital credentials with ${persona.name}.`,
              order: 0,
              type: 'HUMAN_TASK',
              actions: [],
            },
            {
              title: "Let's get started!",
              description: `BC Wallet is a new app for storing and using credentials on your smartphone. Credentials are things like IDs, licenses and diplomas. Using your BC Wallet is fast and simple. In the future it can be used online and in person. You approve every use, and share only what is needed. In this demo, you will use two credentials to prove who you are and access court materials online instead of in-person.`,
              order: 1,
              type: 'HUMAN_TASK',
              actions: [],
            },
            {
              title: 'Install BC Wallet',
              description: `First, install the BC Wallet app onto your smartphone. Select the button below for instructions and the next step.`,
              order: 2,
              type: 'HUMAN_TASK',
              actions: [
                {
                  title: 'example_title',
                  actionType: StepActionType.ChooseWallet,
                  text: 'example_text',
                  proofRequest: {
                    attributes: {},
                    predicates: {},
                  },
                },
              ],
            },
            {
              title: 'Connect with BC College',
              description: `Imagine, as ${persona.name}, you are logged into the BestBC College website (see below). They want to offer you a Digital Student Card. Use your BC Wallet to scan the QR code from the website.`,
              order: 3,
              type: 'HUMAN_TASK',
              actions: [
                {
                  actionType: StepActionType.SetupConnection,
                  title: 'Download BC Wallet on your phone',
                  text: "To download, scan this QR code with your phone or select the app store icon below. You can also search for BC Wallet in your phone's app store.",
                },
              ],
            },
            {
              title: 'Accept your student card',
              description: `Your wallet now has a secure and private connection with BestBC College. You should have received an offer in BC Wallet for a Student Card.\nReview what they are sending, and choose 'Accept offer'.`,
              order: 4,
              type: 'SERVICE',
              actions: [
                {
                  actionType: StepActionType.AcceptCredential,
                  title: 'Download BC Wallet on your phone',
                  text: "To download, scan this QR code with your phone or select the app store icon below. You can also search for BC Wallet in your phone's app store.",
                  credentialDefinitionId: '',
                },
              ],
            },
            {
              title: "You're all set!",
              description: `Congratulations, you've just received your first digital credentials. They are safely stored in your wallet and ready to be used. So, what are you waiting for? Let's go! We're done with this step. Next, we'll explore ways you can use your credentials.`,
              order: 5,
              type: 'HUMAN_TASK',
              actions: [],
            },
          ],
          personas: [persona.id],
          hidden: false,
          issuer: issuerId,
        }

        state.personaScenariosMap[persona.id] = [defaultOnboarding]
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

        duplicatedScenario.steps = duplicatedScenario.steps.map((step: Screen, idx: number) => ({
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
        state.selectedStep = selectedStep;
        
        // If a step is selected, set the step state based on action
        if (selectedStep) {
          state.stepState = getStepStateFromAction(selectedStep);
        } else {
          state.stepState = 'no-selection';
        }
      }),

    selectStep: (stepIndex, scenarioIndex) =>
      set((state) => {
        if (state.activeScenarioIndex !== scenarioIndex) {
          state.activeScenarioIndex = scenarioIndex
        }

        if (state.activePersonaId && state.personaScenariosMap[state.activePersonaId]) {
          const scenarios = state.personaScenariosMap[state.activePersonaId]

          if (scenarioIndex >= 0 && scenarioIndex < scenarios.length) {
            const steps = scenarios[scenarioIndex].steps

            if (stepIndex >= 0 && stepIndex < steps.length) {
              const currentStep = steps[stepIndex] as Screen;
              state.selectedStep = currentStep;
              
              // Set state based on action type of the selected step
              state.stepState = getStepStateFromAction(currentStep);
            }
          }
        }
      }),
  })),
)