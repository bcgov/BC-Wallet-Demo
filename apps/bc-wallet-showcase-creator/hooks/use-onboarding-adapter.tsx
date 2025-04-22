'use client'

import { useCallback } from 'react'
import { useOnboardingCreation } from './use-onboarding-creation'
import type { Persona, StepRequest } from 'bc-wallet-openapi'
import type { Screen } from '@/types'

export const useOnboardingAdapter = () => {
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
    setSelectedStep: setSelectedStepInternal,
    selectStep,
  } = useOnboardingCreation()

  const getCurrentSteps = useCallback(() => {
    if (!activePersonaId || !personaScenarios.has(activePersonaId)) return []

    const scenarioList = personaScenarios.get(activePersonaId)!

    if (activeScenarioIndex < 0 || activeScenarioIndex >= scenarioList.length) return []

    return scenarioList[activeScenarioIndex].steps as Screen[]
  }, [activePersonaId, personaScenarios, activeScenarioIndex])

  const steps = getCurrentSteps()

  // Get the action type from a step
  const getStepActionType = useCallback((step: Screen): string | null => {
    if (!step.actions || step.actions.length === 0) return null;
    return step.actions[0].actionType || null;
  }, []);

  // Set the appropriate step state based on action type
  const setStepStateFromAction = useCallback((actionType: string | null) => {
    if (!actionType) {
      setStepState('editing-basic');
      return;
    }

    switch (actionType) {
      case 'CHOOSE_WALLET':
        // setStepState('editing-wallet');
        break;
      case 'SETUP_CONNECTION':
      case 'ARIES_OOB':
        // setStepState('editing-connect');
        break;
      case 'ACCEPT_CREDENTIAL':
        setStepState('editing-issue');
        break;
      default:
        setStepState('editing-basic');
    }
  }, [setStepState]);

  // Enhanced setSelectedStep that accepts either a number or null
  const setSelectedStep = useCallback((indexOrNull: number | null) => {
    if (indexOrNull === null) {
      // Reset selection
      setSelectedStepInternal(null);
      setStepState('no-selection');
      return;
    }
    
    // Get the step at the given index
    const step = steps[indexOrNull];
    if (!step) {
      console.error(`No step found at index ${indexOrNull}`);
      return;
    }
    
    // Set the selected step to be the actual step object
    setSelectedStepInternal(step);
    
    // Get the action type and set appropriate state
    const actionType = getStepActionType(step);
    setStepStateFromAction(actionType);
  }, [setSelectedStepInternal, steps, setStepState, getStepActionType, setStepStateFromAction]);

  const createStep = useCallback(
    (stepData: StepRequest) => {
      if (!activePersonaId) return

      addStep(activePersonaId, activeScenarioIndex, stepData as Screen)
      
      // After adding, the new step will be at the end of the list
      const newStepIndex = steps.length;
      
      // Get the newly added step
      const newStep = getCurrentSteps()[newStepIndex];
      if (newStep) {
        setSelectedStepInternal(newStep);
        
        // Set state based on action type
        const actionType = getStepActionType(newStep);
        setStepStateFromAction(actionType);
      }
    },
    [
      activePersonaId, 
      activeScenarioIndex, 
      addStep, 
      steps.length, 
      setSelectedStepInternal, 
      getCurrentSteps, 
      getStepActionType, 
      setStepStateFromAction
    ],
  )

  const handleUpdateStep = useCallback(
    (index: number, stepData: StepRequest) => {
      if (!activePersonaId) return

      updateStep(activePersonaId, activeScenarioIndex, index, stepData as Screen)
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

  const activePersona = activePersonaId 
    ? selectedPersonas.find((p: Persona) => p.id === activePersonaId) || null 
    : null

  const handleSelectStep = useCallback(
    (stepIndex: number, scenarioIndex: number = activeScenarioIndex) => {      
      selectStep(stepIndex, scenarioIndex);
      
      const step = steps[stepIndex];
      if (step) {
        const actionType = getStepActionType(step);
        setStepStateFromAction(actionType);
      }
    },
    [selectStep, activeScenarioIndex, steps, getStepActionType, setStepStateFromAction],
  );

  // Find the index of the currently selected step
  const selectedStepIndex = selectedStep 
    ? steps.findIndex(step => step.id === selectedStep.id)
    : null;

  // Get the action type of the selected step
  const selectedStepActionType = selectedStep 
    ? getStepActionType(selectedStep) 
    : null;

  return {
    steps,
    selectedStep,
    selectedStepIndex,
    selectedStepActionType, // New property to expose the action type
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
    duplicateScenario,
    activeScenarioIndex,
    setActiveScenarioIndex,
    deleteScenario,
    selectedScenario,
    updateScenario,
    removeScenario,
  }
}