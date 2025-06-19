'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePresentationCreation } from './use-presentation-creation'
import type { Persona, PresentationScenarioRequest, StepRequest } from 'bc-wallet-openapi'
import { useShowcase, useUpdateShowcaseScenarios } from './use-showcases'
import { useShowcaseStore } from './use-showcases-store'
import { useHelpersStore } from './use-helpers-store'
import { useQueryClient } from '@tanstack/react-query'
import { debugLog } from '@/lib/utils'
import { useCreatePresentation, usePresentation, useUpdateScenario } from './use-presentation'
import { toast } from 'sonner'
import { useTenant } from '@/providers/tenant-provider'
import { useRouter } from '@/i18n/routing'

export const usePresentationAdapter = (showcaseSlug?: string) => {

  const { data: showcaseData, isLoading: isShowcaseLoading } = useShowcase(showcaseSlug || '')
  const { setScenarioIds, currentShowcaseSlug } = useShowcaseStore()
  const { issuerId, relayerId } = useHelpersStore()
  const { mutateAsync: createScenarioAsync } = useCreatePresentation()
  const { mutateAsync: updateScenarioAsync } = useUpdateScenario()
  const { mutateAsync: updateShowcaseScenariosAsync } = useUpdateShowcaseScenarios();
  const [localSelectedStep, setLocalSelectedStep] = useState<Screen | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasNoScenarios, setHasNoScenarios] = useState(false);
  const queryClient = useQueryClient()
  const { tenantId } = useTenant();
  const router = useRouter()

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
    // updateScenario,
    removeScenario,
    selectedStep,
    setSelectedStep,
    selectStep,
    isShowcaseLoading: isCreationLoading,
    isInitialized: isCreationInitialized,
  } = usePresentationCreation(showcaseSlug)
  
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
    if (!activePersonaId || !personaScenarios.has(activePersonaId)) return []

    const scenarioList = personaScenarios.get(activePersonaId)!

    if (activeScenarioIndex < 0 || activeScenarioIndex >= scenarioList.length) return []

    return scenarioList[activeScenarioIndex].steps
  }, [activePersonaId, personaScenarios, activeScenarioIndex])

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

  const createScenarios = useCallback(async (scenariosToCreate?: PresentationScenarioRequest[]) => {
    try {
      const personaScenariosList = scenariosToCreate ??
      selectedPersonas
        .map((persona) => {
          if(!personaScenarios.has(persona.id)) return null;

          const scenarioList = personaScenarios.get(persona.id)!;
          if (!scenarioList.length) return null;

          return scenarioList
          //@ts-expect-error
          .filter(s => !s.slug)
          .map(scenario => ({
            ...scenario,
            personas: [persona.id],
            relyingParty: relayerId,
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

      if(personaScenariosList.length === 0) {
        return { success: false, message: 'No scenarios to create' };
      }

      const scenarioIds = [];

      for(const scenario of personaScenariosList) {
        if(!scenario) continue;

        try {
          const result = await createScenarioAsync(scenario);

          if(result && result.presentationScenario) {
            scenarioIds.push(result.presentationScenario.id);
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
  },[selectedPersonas, personaScenarios, issuerId, createScenarioAsync, setScenarioIds])


  const updateScenario = useCallback(async (slug: string) => {
    try {
      const personaScenariosList = selectedPersonas
        .map((persona) => {
          if (!personaScenarios.has(persona.id)) return null;

          const scenarioList = personaScenarios.get(persona.id)!;
          if (!scenarioList.length) return null;

          return scenarioList.map(scenario => ({
            ...scenario,
            personas: [persona.id],
            relyingParty: relayerId,
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
        if(!scenario) continue;
        let result;

        //@ts-ignore
        if(!scenario.slug) {
          console.log('Scenario slug is missing:', scenario);
          
          result = await createScenarios([scenario])
          if (result && result.success) {
            toast.success('Scenarios created successfully')
            router.push(`/${tenantId}/showcases/create/publish`)
          } else {
            throw new Error('Invalid response format');
          }
        } else {
          try {
            result = await updateScenarioAsync({
              // @ts-expect-error: slug is not required
              slug: scenario.slug,
              data: scenario
            }, {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['showcase', slug] })
              }
            });
              if (result && result.presentationScenario) {
                scenarioIds.push(result.presentationScenario.id);
              } else {
                throw new Error('Invalid response format');
              }
            } catch (error) {
              return { success: false, message: 'Error updating scenario', error };
            }
        }        
      }

      setScenarioIds(scenarioIds);
      return { success: true, scenarioIds };

    } catch (error) {
      return { success: false, message: 'Error in scenario update', error };
    }
  },[selectedPersonas, personaScenarios, issuerId, updateScenarioAsync, setScenarioIds])

  const steps = getCurrentSteps()

  const createStep = useCallback(
    (stepData: StepRequest) => {
      if (!activePersonaId) return

      const firstPersona = selectedPersonas[0];
      setActivePersonaId(firstPersona.id);
      addStep(activePersonaId, activeScenarioIndex, stepData)
      setSelectedStep({ stepIndex: steps.length, scenarioIndex: activeScenarioIndex })
      setStepState('editing-basic')
    },
    [activePersonaId, activeScenarioIndex, addStep, steps.length, setActivePersonaId],
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

  const activePersona = activePersonaId ? selectedPersonas.find((p: Persona) => p.id === activePersonaId) || null : null

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
      //@ts-ignore
      id: step.id || `temp-step-${Date.now()}-${stepIndex}`,
    };

    //@ts-ignore
    setLocalSelectedStep(enhancedStep);

    const newState = step.type === 'SERVICE' ? 'editing-basic' : 'editing-basic';
    setStepState(newState);
  };

  const handleSelectStep = useCallback(
    (stepIndex: number, scenarioIndex: number = activeScenarioIndex) => {      
      handleSelectStepImpl(stepIndex, scenarioIndex);
    },
    [activeScenarioIndex, selectStep],
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
    duplicateScenario,
    activeScenarioIndex,
    setActiveScenarioIndex,
    deleteScenario,
    selectedScenario,
    updateScenario,
    createScenarios,
    isEditMode: showcaseSlug ?? true,
    isLoading: isShowcaseLoading || isCreationLoading,
    isInitialized: isInitialized && isCreationInitialized,
    removeScenario,
  }
}
