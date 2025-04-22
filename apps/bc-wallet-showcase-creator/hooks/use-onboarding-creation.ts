import { useEffect } from 'react'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { usePersonas } from './use-personas'
import type { Persona, IssuanceScenarioRequest, StepActionRequest } from 'bc-wallet-openapi'
import { Screen } from '@/types'
import { useOnboardingCreationStore } from './use-onboarding-store'

export const useOnboardingCreation = () => {
  const { selectedPersonaIds } = useShowcaseStore()
  const { issuerId, selectedCredentialDefinitionIds } = useHelpersStore()
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
    selectedStep,
    setSelectedStep,
    selectStep,
  } = useOnboardingCreationStore()

  useEffect(() => {
    const personas = (personasData?.personas || []).filter((persona: Persona) =>
      selectedPersonaIds.includes(persona.id),
    )

    personas.forEach((persona: Persona) => {
      if (!personaScenariosMap[persona.id]) {
        addPersonaScenario(persona, issuerId)
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
    issuerId,
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
    updatePersonaSteps: (personaId: string, steps: Screen[]) => 
      updatePersonaSteps(personaId, activeScenarioIndex, steps),
    addActionToStep: (personaId: string, stepIndex: number, action: StepActionRequest) => 
      addActionToStep(personaId, activeScenarioIndex, stepIndex, action),
    addPersonaScenario: (persona: Persona) => addPersonaScenario(persona, issuerId),
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
    updateScenario: (scenarioData: IssuanceScenarioRequest) =>
      activePersonaId && updateScenario(activePersonaId, activeScenarioIndex, scenarioData),
    removeScenario: () => activePersonaId && removeScenario(activePersonaId, activeScenarioIndex),
    selectedStep,
    setSelectedStep,
    selectStep,
  }
}