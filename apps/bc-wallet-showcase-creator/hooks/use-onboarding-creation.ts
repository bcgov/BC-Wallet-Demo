'use client'

import { useEffect, useState } from 'react'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { usePersonas } from './use-personas'
import { type Persona, type IssuanceScenarioRequest, type StepActionRequest } from 'bc-wallet-openapi'
import { Screen } from '@/types'
import { useOnboardingCreationStore } from './use-onboarding-store'
import { useShowcase } from './use-showcases'
import { issuanceScenarioToIssuanceScenarioRequest } from '@/lib/parsers'

export const useOnboardingCreation = (showcaseSlug?: string) => {
  const { selectedPersonaIds } = useShowcaseStore()
  const { issuerId, selectedCredentialDefinitionIds } = useHelpersStore()
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
    selectedStep,
    setSelectedStep,
    selectStep,
    initializeWithScenarios,
    reset
  } = useOnboardingCreationStore()

  useEffect(() => {
    if (showcaseSlug && showcaseData && !isInitialized && personasData) {
      const showcase = showcaseData?.showcase

      if (showcase) {
        const issuanceScenarios = showcase.scenarios?.filter((scenario) => scenario.type === 'ISSUANCE') || []

        if (issuanceScenarios.length === 0) {
          initializeWithScenarios(personaScenariosMap)
          setIsInitialized(true)
          return
        } else {
          const personaScenariosData: Record<string, IssuanceScenarioRequest[]> = {}
          issuanceScenarios.forEach((scenario) => {
            if (scenario.personas && scenario.personas.length > 0) {
              scenario.personas.forEach((persona) => {
                if (!personaScenariosData[persona.id]) {
                  personaScenariosData[persona.id] = []
                }

                const scenarioRequest = issuanceScenarioToIssuanceScenarioRequest(scenario)

                personaScenariosData[persona.id].push(scenarioRequest)
              })
            }
          })

          const mergedScenarios: Record<string, IssuanceScenarioRequest[]> = { ...personaScenariosMap }

          for (const personaId in personaScenariosData) {
            const apiScenarios = personaScenariosData[personaId]
            const localScenarios = mergedScenarios[personaId] || []

            const mergedPersonaScenarios: IssuanceScenarioRequest[] = []

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
    } else if (!showcaseSlug && !isInitialized) {
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
      setIsInitialized(true)
    }
  }, [
    showcaseSlug,
    showcaseData,
    isShowcaseLoading,
    isInitialized,
    initializeWithScenarios,
    activePersonaId,
    setActivePersonaId,
    issuerId,
    personasData,
    addPersonaScenario,
    selectedPersonaIds,
    personaScenariosMap
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
    updateScenario,
    removeScenario: () => activePersonaId && removeScenario(activePersonaId, activeScenarioIndex),
    selectedStep,
    setSelectedStep,
    selectStep,
    isShowcaseLoading,
    isInitialized,
    reset,
  }
}