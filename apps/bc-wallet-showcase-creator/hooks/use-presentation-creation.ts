import { useEffect, useState } from 'react'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { usePersonas } from './use-personas'
import type { Persona, PresentationScenarioRequest, StepActionRequest, StepRequest } from 'bc-wallet-openapi'
import { useShowcase } from './use-showcases'
import { presentationScenarioToPresentationScenarioRequest } from '@/lib/parsers'
import { usePresentationCreationStore } from './use-presentation-store'

export const usePresentationCreation = (showcaseSlug?: string) => {
  const { selectedPersonaIds } = useShowcaseStore()
  const { relayerId, selectedCredentialDefinitionIds } = useHelpersStore()
  const { data: personasData } = usePersonas()
  const { data: showcaseData, isLoading: isShowcaseLoading } = useShowcase(showcaseSlug || '')
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastShowcaseSlug, setLastShowcaseSlug] = useState<string | undefined>(undefined)
  
  // Reset initialization when showcase slug changes
  useEffect(() => {
    if (lastShowcaseSlug !== showcaseSlug) {
      setIsInitialized(false)
      setLastShowcaseSlug(showcaseSlug)
    }
  }, [showcaseSlug, lastShowcaseSlug])

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


  // Cleanup stale personas from store when selectedPersonaIds changes
  useEffect(() => {
    const currentStorePersonas = Object.keys(personaScenariosMap)
    const stalePersonas = currentStorePersonas.filter(id => !selectedPersonaIds.includes(id))
    
    
    if (stalePersonas.length > 0) {
      // Instead of trying to clean up selectively, just reset and let reinitialization handle it
      reset()
      setIsInitialized(false)
    }
  }, [selectedPersonaIds, personaScenariosMap, reset])

  useEffect(() => {    
    if (showcaseSlug && showcaseData && !isInitialized && personasData) {
      const showcase = showcaseData?.showcase

      if (showcase) {
        const presentationScenarios = showcase.scenarios?.filter((scenario) => scenario.type === 'PRESENTATION') || []

        if (presentationScenarios.length === 0) {
          initializeWithScenarios(personaScenariosMap)
          setIsInitialized(true)
          return
        } else {
          const personaScenariosData: Record<string, PresentationScenarioRequest[]> = {}
          
          presentationScenarios.forEach((scenario, index) => {
            
            if (scenario.personas && scenario.personas.length > 0) {
              scenario.personas.forEach((persona) => {
                if (!personaScenariosData[persona.id]) {
                  personaScenariosData[persona.id] = []
                }

                const scenarioRequest = presentationScenarioToPresentationScenarioRequest(scenario)
                personaScenariosData[persona.id].push(scenarioRequest)
              })
            } else {
              console.log('Scenario has no personas, skipping')
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
    } else if (!showcaseSlug && !isInitialized && Object.keys(personaScenariosMap).length === 0) {
      // Only create default scenarios if:
      // 1. No showcase slug (not in showcase context)
      // 2. Not already initialized 
      // 3. No existing scenarios in the map (to avoid overriding showcase-loaded scenarios)
      const personas = (personasData?.personas || []).filter((persona: Persona) =>
        selectedPersonaIds.includes(persona.id),
      )
      
      if (personas.length > 0) {
        personas.forEach((persona: Persona) => {
          if (!personaScenariosMap[persona.id]) {
            addPersonaScenario(persona, relayerId)
          }
        })

        if (!activePersonaId) {
          setActivePersonaId(personas[0].id)
        }
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
    relayerId,
    personasData,
    addPersonaScenario,
    selectedPersonaIds,
    personaScenariosMap,
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
