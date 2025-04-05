import { useCallback } from 'react'
import type { ShowcaseRequestType, StepRequestType } from '@/openapi-types'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/apiService'
import { usePresentationCreation } from './use-presentation-creation'
import type {  Persona } from 'bc-wallet-openapi'

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
    (stepData: StepRequestType) => {
      if (!activePersonaId) return

      addStep(activePersonaId, activeScenarioIndex, stepData)
      // Set the newly added step as selected
      setSelectedStep({ stepIndex: steps.length, scenarioIndex: activeScenarioIndex })
      setStepState('editing-basic')
    },
    [activePersonaId, activeScenarioIndex, addStep, steps.length],
  )

  // Update step wrapper
  const handleUpdateStep = useCallback(
    (index: number, stepData: StepRequestType) => {
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
    mutationFn: async (showcaseData: ShowcaseRequestType) => {
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

  // const handleSelectStep = useCallback(
  //   (stepIndex: number, scenarioIndex: number = activeScenarioIndex) => {
  //     console.log('handleSelectStep', { stepIndex, scenarioIndex })
  //     if (scenarioIndex !== activeScenarioIndex) {
  //       setActiveScenarioIndex(scenarioIndex)
  //     }

  //     setSelectedStep(stepIndex)

  //     if (activePersonaId && personaScenarios.has(activePersonaId)) {
  //       const scenarios = personaScenarios.get(activePersonaId)!

  //       if (scenarioIndex >= 0 && scenarioIndex < scenarios.length) {
  //         const steps = scenarios[scenarioIndex].steps

  //         if (stepIndex >= 0 && stepIndex < steps.length) {
  //           const currentStep = steps[stepIndex]

  //           if (currentStep.type === 'SERVICE') {
  //             setStepState('editing-issue')
  //           } else {
  //             setStepState('editing-basic')
  //           }
  //         }
  //       }
  //     }
  //   },
  //   [activeScenarioIndex, setActiveScenarioIndex, setSelectedStep, activePersonaId, personaScenarios, setStepState],
  // )

  const handleSelectStep = useCallback(
    (stepIndex: number, scenarioIndex: number = activeScenarioIndex) => {
      console.log('handleSelectStep', { stepIndex, scenarioIndex });
      
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
