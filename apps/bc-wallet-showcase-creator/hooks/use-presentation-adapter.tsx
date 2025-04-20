import { useCallback } from 'react'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/apiService'
import { usePresentationCreation } from './use-presentation-creation'
import type { Persona, ShowcaseRequest, StepRequest } from 'bc-wallet-openapi'

export const usePresentationAdapter = () => {
  const {
    selectedPersonas,
    personaScenarios,
    activePersonaId,
    setActivePersonaId,
    duplicateScenario,
    activeScenarioIndex,
    setActiveScenarioIndex,
    deleteScenario,
    addStep,
    updateStep,
    deleteStep,
    moveStep,
    duplicateStep,
    setStepState,
    stepState,
    selectedScenario,
    updateScenario,
    removeScenario,
    selectedStep,
    setSelectedStep,
    selectStep,
  } = usePresentationCreation()

  const { displayShowcase } = useShowcaseStore()
  const queryClient = useQueryClient()

  const getCurrentSteps = useCallback(() => {
    if (!activePersonaId || !personaScenarios.has(activePersonaId)) return []

    const scenarioList = personaScenarios.get(activePersonaId)!

    if (activeScenarioIndex < 0 || activeScenarioIndex >= scenarioList.length) return []

    return scenarioList[activeScenarioIndex].steps
  }, [activePersonaId, personaScenarios, activeScenarioIndex])

  const steps = getCurrentSteps()

  const createStep = useCallback(
    (stepData: StepRequest) => {
      if (!activePersonaId) return

      addStep(activePersonaId, activeScenarioIndex, stepData)
      setSelectedStep({ stepIndex: steps.length, scenarioIndex: activeScenarioIndex })
      setStepState('editing-basic')
    },
    [activePersonaId, activeScenarioIndex, addStep, steps.length],
  )

  const handleUpdateStep = useCallback(
    (index: number, stepData: StepRequest) => {
      if (!activePersonaId) return

      updateStep(activePersonaId, activeScenarioIndex, index, stepData)
    },
    [activePersonaId, activeScenarioIndex, updateStep],
  )

  const handleDuplicateStep = useCallback(
    (stepIndex: number) => {
      if (!activePersonaId) {
        console.error('Cannot duplicate - no active persona')
        return
      }

      duplicateStep(activePersonaId, activeScenarioIndex, stepIndex)
    },
    [activePersonaId, activeScenarioIndex, duplicateStep],
  )

  const handleMoveStep = useCallback(
    (oldIndex: number, newIndex: number) => {
      if (!activePersonaId) return

      moveStep(activePersonaId, activeScenarioIndex, oldIndex, newIndex)
    },
    [activePersonaId, activeScenarioIndex, moveStep],
  )

  const updateShowcaseMutation = useMutation({
    mutationFn: async (showcaseData: ShowcaseRequest) => {
      let response

      if (displayShowcase.id) {
        response = await apiClient.put(`/showcases/${displayShowcase.slug}`, showcaseData)
      } else {
        response = await apiClient.post('/showcases', showcaseData)
      }

      return response
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['showcases'] })
    },
  })

  const activePersona = activePersonaId ? selectedPersonas.find((p: Persona) => p.id === activePersonaId) || null : null

  const handleSelectStep = useCallback(
    (stepIndex: number, scenarioIndex: number = activeScenarioIndex) => {      
      selectStep(stepIndex, scenarioIndex);
    },
    [selectStep],
  );

  return {
    steps,
    selectedStep,
    setSelectedStep,
    handleSelectStep,
    createStep,
    updateStep: handleUpdateStep,
    moveStep: handleMoveStep,
    deleteStep: (index: number) => activePersonaId && deleteStep(activePersonaId, activeScenarioIndex, index),
    duplicateStep: handleDuplicateStep,
    setStepState,
    stepState,
    personas: selectedPersonas,
    activePersonaId,
    setActivePersonaId,
    activePersona,
    scenarios:
      activePersonaId && personaScenarios.has(activePersonaId) ? personaScenarios.get(activePersonaId) || [] : [],
    personaScenarios,
    isSaving: updateShowcaseMutation.isPending,
    duplicateScenario,
    activeScenarioIndex,
    setActiveScenarioIndex,
    deleteScenario,
    selectedScenario,
    updateScenario,
    removeScenario,
  }
}
