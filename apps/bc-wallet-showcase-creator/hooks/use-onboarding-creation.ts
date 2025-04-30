'use client'

import { useEffect, useState } from 'react'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { usePersonas } from './use-personas'
import type { Persona, IssuanceScenarioRequest, StepActionRequest } from 'bc-wallet-openapi'
import { Screen } from '@/types'
import { useOnboardingCreationStore } from './use-onboarding-store'
import { useShowcase } from './use-showcases'

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
    if (showcaseSlug && showcaseData && !isInitialized && !isShowcaseLoading) {
      const showcase = showcaseData?.showcase
      
      if (showcase) {
        const issuanceScenarios = showcase.scenarios?.filter(
          scenario => scenario.type === 'ISSUANCE'
        ) || []

        if (issuanceScenarios.length === 0) {
          initializeWithScenarios({})
          setIsInitialized(true)
          return
        }
        
        const personaScenariosData: Record<string, IssuanceScenarioRequest[]> = {}
        
        issuanceScenarios.forEach(scenario => {
          if (scenario.personas && scenario.personas.length > 0) {
            scenario.personas.forEach(persona => {
              if (!personaScenariosData[persona.id]) {
                personaScenariosData[persona.id] = []
              }
              
              const scenarioRequest: IssuanceScenarioRequest = {
                name: scenario.name,
                description: scenario.description,
                steps: scenario.steps?.map(step => ({
                  ...step,
                })) as Screen[] || [],
                personas: scenario.personas.map(p => p.id),
                hidden: scenario.hidden,
                issuer: scenario.issuer?.id,
              // @ts-expect-error: slug is not required
                slug: scenario.slug
              }
              
              personaScenariosData[persona.id].push(scenarioRequest)
            })
          }
        })
        
        initializeWithScenarios(personaScenariosData)
        
        if (!activePersonaId && Object.keys(personaScenariosData).length > 0) {
          setActivePersonaId(Object.keys(personaScenariosData)[0])
        }
        
        setIsInitialized(true)
      }
    }
  }, [
    showcaseSlug, 
    showcaseData, 
    isShowcaseLoading, 
    isInitialized, 
    initializeWithScenarios, 
    activePersonaId, 
    setActivePersonaId
  ])

  useEffect(() => {
    if (showcaseSlug && isInitialized) return
    
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
    showcaseSlug,
    isInitialized,
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
    isShowcaseLoading,
    isInitialized,
    reset,
  }
}