'use client'

import { useCallback, useState, useEffect } from 'react'
import { useOnboardingCreation } from './use-onboarding-creation'
import { toast } from 'sonner'
import { useCreateScenario, useUpdateScenario } from '@/hooks/use-onboarding'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import type { Persona, Showcase, StepRequest } from 'bc-wallet-openapi'
import type { Screen } from '@/types'
import { useUpdateShowcase, useShowcase, useUpdateShowcaseScenarios } from './use-showcases'
import { showcaseToShowcaseRequest, debugLog } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useUiStore } from '@/hooks/use-ui-store'

export const useOnboardingAdapter = (showcaseSlug?: string) => {
  const { mutateAsync: createScenarioAsync } = useCreateScenario()
  const { mutateAsync: updateScenarioAsync } = useUpdateScenario()
  const { mutateAsync: updateShowcaseAsync } = useUpdateShowcase(showcaseSlug || '')
  const { mutateAsync: updateShowcaseScenariosAsync } = useUpdateShowcaseScenarios();

  const { data: showcaseData, isLoading: isShowcaseLoading } = useShowcase(showcaseSlug || '')
  const { setScenarioIds } = useShowcaseStore()
  const { issuerId } = useHelpersStore()
  const {currentShowcaseSlug} = useUiStore()
  
  const [localSelectedStep, setLocalSelectedStep] = useState<Screen | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasNoScenarios, setHasNoScenarios] = useState(false);
  const queryClient = useQueryClient()

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
    isShowcaseLoading: isCreationLoading,
    isInitialized: isCreationInitialized,
    addPersonaScenario,
  } = useOnboardingCreation(showcaseSlug)
  
  useEffect(() => {
    if (showcaseSlug && showcaseData && !isShowcaseLoading) {
      const showcase = showcaseData?.showcase
      if (showcase && (!showcase.scenarios || showcase.scenarios.length === 0)) {
        setHasNoScenarios(true)
      }
    }
  }, [showcaseSlug, showcaseData, isShowcaseLoading])
  
  useEffect(() => {
    if (!showcaseSlug && personaScenarios.size === 0 && selectedPersonas.length > 0 && !isInitialized) {
      const firstPersona = selectedPersonas[0];
      if (firstPersona && !activePersonaId) {
        debugLog('Initial setup: selecting first persona', firstPersona.name);
        setActivePersonaId(firstPersona.id);
        setIsInitialized(true);
      }
    }
  }, [showcaseSlug, personaScenarios, selectedPersonas, activePersonaId, isInitialized, setActivePersonaId])

  const getCurrentSteps = useCallback(() => {
    if (hasNoScenarios) return []
    
    if (!activePersonaId || !personaScenarios.has(activePersonaId)) return []

    const scenarioList = personaScenarios.get(activePersonaId)!

    if (activeScenarioIndex < 0 || activeScenarioIndex >= scenarioList.length) return []

    return scenarioList[activeScenarioIndex].steps as Screen[]
  }, [activePersonaId, personaScenarios, activeScenarioIndex, hasNoScenarios])

  const steps = getCurrentSteps();

  useEffect(() => {
    if (isInitialized || !showcaseSlug || personaScenarios.size === 0) return;
    
    if (activePersonaId && personaScenarios.has(activePersonaId)) {
      const currentSteps = getCurrentSteps();
      
      if (currentSteps.length > 0) {
        handleSelectStepImpl(0, activeScenarioIndex);
        setIsInitialized(true);
      } else {
        setIsInitialized(true);
      }
    } else if (isCreationInitialized) {
      setIsInitialized(true);
    }
  }, [
    showcaseSlug, 
    personaScenarios, 
    activePersonaId, 
    activeScenarioIndex, 
    isInitialized, 
    isCreationInitialized, 
    getCurrentSteps
  ]);

  const getStepActionType = useCallback((step: Screen): string | null => {
    if (!step.actions || step.actions.length === 0) return null;
    return step.actions[0].actionType || null;
  }, []);

  const setStepStateFromAction = useCallback((actionType: string | null) => {
    if (!actionType) {
      setStepState('editing-basic');
      return;
    }

    switch (actionType) {
      case 'CHOOSE_WALLET':
        break;
      case 'SETUP_CONNECTION':
      case 'ARIES_OOB':
        break;
      case 'ACCEPT_CREDENTIAL':
        setStepState('editing-issue');
        break;
      default:
        setStepState('editing-basic');
    }
  }, [setStepState]);

  const handleSelectStepImpl = (stepIndex: number, scenarioIndex: number = activeScenarioIndex) => {
    if (stepIndex < 0 || !steps || stepIndex >= steps.length) {
      return;
    }
    
    const step = steps[stepIndex];
    
    if (scenarioIndex !== activeScenarioIndex) {
      setActiveScenarioIndex(scenarioIndex);
    }
    
    selectStep(stepIndex, scenarioIndex);
    
    const enhancedStep = {
      ...step,
      order: stepIndex,
      id: step.id || `temp-step-${Date.now()}-${stepIndex}`,
      credentials: step.credentials || []
    };
    setLocalSelectedStep(enhancedStep);
    
    const newState = step.type === 'SERVICE' ? 'editing-issue' : 'editing-basic';
    setStepState(newState);
  };

  const handleSelectStep = useCallback(
    (stepIndex: number, scenarioIndex: number = activeScenarioIndex) => {
      handleSelectStepImpl(stepIndex, scenarioIndex);
    },
    [activeScenarioIndex, steps]
  );

  const setSelectedStep = useCallback((stepOrIndex: Screen | number | null) => {
    if (stepOrIndex === null) {
      setSelectedStepInternal(null);
      setLocalSelectedStep(null);
      setStepState('no-selection');
      return;
    }
    
    if (typeof stepOrIndex === 'number') {
      handleSelectStepImpl(stepOrIndex, activeScenarioIndex);
    } else {
      const stepIndex = steps.findIndex(s => 
        (s.id && stepOrIndex.id) ? s.id === stepOrIndex.id : 
        (s.title === stepOrIndex.title && s.description === stepOrIndex.description)
      );
      
      if (stepIndex >= 0) {
        handleSelectStepImpl(stepIndex, activeScenarioIndex);
      } else {
        setSelectedStepInternal(stepOrIndex);
        setLocalSelectedStep(stepOrIndex);
        
        const newState = stepOrIndex.type === 'SERVICE' ? 'editing-issue' : 'editing-basic';
        setStepState(newState);
      }
    }
  }, [steps, activeScenarioIndex, setSelectedStepInternal, setStepState]);

  const createStep = useCallback(
    (stepData: StepRequest) => {
      if (!activePersonaId) {
        console.error('Cannot create step: No active persona selected');
        
        if (selectedPersonas.length > 0) {
          const firstPersona = selectedPersonas[0];
          debugLog('Auto-selecting persona:', firstPersona.name);
          setActivePersonaId(firstPersona.id);
          
          if (!personaScenarios.has(firstPersona.id) || personaScenarios.get(firstPersona.id)?.length === 0) {
            debugLog('Creating default scenario for persona');
            addPersonaScenario(firstPersona);
            setActiveScenarioIndex(0);
            
            setTimeout(() => {
              debugLog('Now adding step to new scenario');
              addStep(firstPersona.id, 0, stepData as Screen);
              
              setTimeout(() => {
                const updatedSteps = getCurrentSteps();
                if (updatedSteps.length > 0) {
                  handleSelectStepImpl(0, 0);
                }
              }, 0);
            }, 0);
            
            return;
          }
        } else {
          console.error('No personas available to create steps for');
          return;
        }
      }

      if (!activePersonaId) {
        console.error('No active persona selected');
        return;
      }

      if (!personaScenarios.has(activePersonaId) || personaScenarios.get(activePersonaId)?.length === 0) {
        const activePersona = selectedPersonas.find(p => p.id === activePersonaId);
        if (activePersona) {
          debugLog('Creating default scenario for active persona');
          addPersonaScenario(activePersona);
          setActiveScenarioIndex(0);
          
          setTimeout(() => {
            debugLog('Now adding step to new scenario');
            addStep(activePersonaId, 0, stepData as Screen);
            
            setTimeout(() => {
              const updatedSteps = getCurrentSteps();
              if (updatedSteps.length > 0) {
                handleSelectStepImpl(0, 0);
              }
            }, 0);
          }, 0);
          
          return;
        }
      }

      addStep(activePersonaId, activeScenarioIndex, stepData as Screen);      
      
      const newStepIndex = steps.length;
      setTimeout(() => {
        const updatedSteps = getCurrentSteps();        
        if (updatedSteps.length > newStepIndex) {
          handleSelectStepImpl(newStepIndex, activeScenarioIndex);
        }
      }, 0);
    },
    [
      activePersonaId,
      selectedPersonas,
      setActivePersonaId,
      personaScenarios,
      activeScenarioIndex,
      setActiveScenarioIndex,
      addPersonaScenario,
      addStep,
      steps.length, 
      getCurrentSteps
    ]
  );

  const handleUpdateStep = useCallback(
    (index: number, stepData: StepRequest) => {
      if (!activePersonaId) return

      updateStep(activePersonaId, activeScenarioIndex, index, stepData as Screen);
      
      const effectiveSelectedStep = selectedStep || localSelectedStep;
      
      if (effectiveSelectedStep && (
          (effectiveSelectedStep.id && (stepData as Screen).id && effectiveSelectedStep.id === (stepData as Screen).id) ||
          ('order' in effectiveSelectedStep && effectiveSelectedStep.order === index)
        )) {
        setLocalSelectedStep({
          ...(stepData as Screen),
          order: index,
          id: (stepData as Screen).id || effectiveSelectedStep.id
        });
      }
    },
    [activePersonaId, activeScenarioIndex, updateStep, selectedStep, localSelectedStep],
  );

  const handleDuplicateStep = useCallback(
    (stepIndex: number) => {
      if (!activePersonaId) {
        return;
      }

      duplicateStep(activePersonaId, activeScenarioIndex, stepIndex);
    },
    [activePersonaId, activeScenarioIndex, duplicateStep],
  );

  const handleMoveStep = useCallback(
    (oldIndex: number, newIndex: number) => {
      if (!activePersonaId) return;

      moveStep(activePersonaId, activeScenarioIndex, oldIndex, newIndex);
      
      const effectiveSelectedStep = selectedStep || localSelectedStep;
      
      if (effectiveSelectedStep && 'order' in effectiveSelectedStep && effectiveSelectedStep.order === oldIndex) {
        setTimeout(() => {
          handleSelectStepImpl(newIndex, activeScenarioIndex);
        }, 0);
      }
    },
    [activePersonaId, activeScenarioIndex, moveStep, selectedStep, localSelectedStep],
  );

  const activePersona = activePersonaId 
    ? selectedPersonas.find((p: Persona) => p.id === activePersonaId) || null 
    : null;

  const effectiveSelectedStep = selectedStep || localSelectedStep;
  
  const selectedStepIndex = useCallback(() => {
    if (!effectiveSelectedStep || !steps.length) return null;
    
    if ('order' in effectiveSelectedStep && typeof effectiveSelectedStep.order === 'number') {
      return effectiveSelectedStep.order;
    }
    
    if (effectiveSelectedStep.id) {
      const index = steps.findIndex(step => step.id === effectiveSelectedStep.id);
      if (index >= 0) return index;
    }
    
    return steps.findIndex(step => 
      step.title === effectiveSelectedStep.title && 
      step.description === effectiveSelectedStep.description
    );
  }, [effectiveSelectedStep, steps])();

  const selectedStepActionType = effectiveSelectedStep 
    ? getStepActionType(effectiveSelectedStep) 
    : null;

  const createScenarios = useCallback(async () => {
    try {
      const personaScenariosList = selectedPersonas
        .map((persona) => {
          if (!personaScenarios.has(persona.id)) return null;
          
          const scenarioList = personaScenarios.get(persona.id)!;
          if (!scenarioList.length) return null;
          
          return scenarioList.map(scenario => ({
            ...scenario,
            personas: [persona.id],
            issuer: issuerId,
            steps: scenario.steps.map((step, index) => ({
              title: step.title,
              description: step.description,
              asset: step.asset || undefined,
              type: step.type || 'HUMAN_TASK',
              order: index,
              screenId: 'INFO',
              actions: step.actions || [],
            }))
          }));
        })
        .filter(Boolean)
        .flat();

      if (personaScenariosList.length === 0) {
        return { success: false, message: 'No scenarios to create' };
      }

      const scenarioIds = [];

      for (const scenario of personaScenariosList) {
        if (!scenario) continue;
        try {
          const result = await createScenarioAsync(scenario);

          if (result && result.issuanceScenario) {
            scenarioIds.push(result.issuanceScenario.id);
            toast.success(`Scenario created for ${scenario.personas[0] ? selectedPersonas.find(p => p.id === scenario.personas[0])?.name || 'persona' : 'persona'}`);
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          return { success: false, message: 'Error creating scenario', error };
        } finally {
          debugLog('set scenario ids createScenarioAsync result ==> ', scenarioIds, currentShowcaseSlug);
          setScenarioIds(scenarioIds);
          if (currentShowcaseSlug && scenarioIds.length > 0) {
            debugLog('Directly updating showcase with scenario IDs:', scenarioIds);
            
            try {
              await updateShowcaseScenariosAsync({ 
                showcaseSlug: currentShowcaseSlug, 
                scenarioIds 
              });
              
              debugLog('Successfully updated showcase with scenario IDs');
            } catch (updateError) {
              console.error('Error updating showcase with scenarios:', updateError);
            }
          }
          
          queryClient.invalidateQueries({ queryKey: ['showcase', currentShowcaseSlug] });
        }
      }

      return { success: true, scenarioIds };
    } catch (error) {
      return { success: false, message: 'Error in scenario creation', error };
    }
  }, [selectedPersonas, personaScenarios, issuerId, createScenarioAsync, setScenarioIds]);

  const updateScenarios = useCallback(async (slug: string) => {
    try {
      const personaScenariosList = selectedPersonas
        .map((persona) => {
          if (!personaScenarios.has(persona.id)) return null;
          
          const scenarioList = personaScenarios.get(persona.id)!;
          if (!scenarioList.length) return null;
          
          return scenarioList.map(scenario => ({
            ...scenario,
            personas: [persona.id],
            issuer: issuerId,
            steps: scenario.steps.map((step, index) => ({
              title: step.title,
              description: step.description,
              asset: step.asset || undefined,
              type: step.type || 'HUMAN_TASK',
              order: index,
              screenId: 'INFO',
              actions: step.actions?.map(action => ({
                ...action,
                createdAt: undefined,
                updatedAt: undefined,
              })) || [],
            }))
          }));
        })
        .filter(Boolean)
        .flat();

      if (personaScenariosList.length === 0) {
        return { success: false, message: 'No scenarios to update' };
      }

      const scenarioIds = [];

      for (const scenario of personaScenariosList) {
        if (!scenario) continue;
        try {
          const result = await updateScenarioAsync({
            // @ts-expect-error: slug is not required
            slug: scenario.slug,
            data: scenario
          }, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['showcase', slug] })
            }
          });
          
          if (result && result.issuanceScenario) {
            scenarioIds.push(result.issuanceScenario.id);
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          return { success: false, message: 'Error updating scenario', error };
        }
      }

      // add scenario ids to the store
      // add scenario ids to the shwocase 
      setScenarioIds(scenarioIds);
      return { success: true, scenarioIds };
    } catch (error) {
      return { success: false, message: 'Error in scenario update', error };
    }
  }, [selectedPersonas, personaScenarios, issuerId, updateScenarioAsync, setScenarioIds]);

  const updateShowcaseName = useCallback(async (name: string, showcase: Showcase) => {
    const showcaseRequest = showcaseToShowcaseRequest(showcase);
    try {
      const result = await updateShowcaseAsync({
        ...showcaseRequest,
        name
      });

      if (result && result.showcase) {
        toast.success('Showcase name updated');
        return { 
          success: true, 
          message: 'Showcase name updated successfully',
          slug: result.showcase.slug
        };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      return { success: false, message: 'Error in showcase update', error };
    }
  }, [updateShowcaseAsync]);  

  return {
    steps,
    selectedStep: effectiveSelectedStep,
    selectedStepIndex,
    selectedStepActionType,
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
    createScenarios,
    updateScenarios,
    isEditMode: !!showcaseSlug,
    updateShowcaseName,
    isLoading: isShowcaseLoading || isCreationLoading,
    isInitialized: isInitialized && isCreationInitialized,
    hasNoScenarios
  }
}