'use client'

import { useEffect, useState, useCallback, useRef } from "react";
import { StepState, useOnboarding } from "@/hooks/use-onboarding";
import { useShowcaseCreation } from "@/hooks/use-showcase-creation";
import { createDefaultStep, createServiceStep, StepRequestUIActionTypes } from "@/lib/steps";
import { useShowcaseStore } from "@/hooks/use-showcases-store";
import { useHelpersStore } from "./use-helpers-store";
import { useUiStore } from "./use-ui-store";
import { useUpdateShowcase } from "./use-showcases";
import { Persona, ShowcaseRequest, StepRequest, StepType } from "bc-wallet-openapi";

export const useOnboardingAdapter = () => {
  const {
    screens: originalSteps,
    selectedStep,
    initializeScreens,
    createStep: originalCreateStep,
    updateStep: originalUpdateStep,
    removeStep: originalRemoveStep,
    moveStep: originalMoveStep,
    setStepState: originalSetStepState,
    stepState,
    setSelectedStep,
    reset,
  } = useOnboarding();

  const {
    selectedPersonas,
    personaScenarios,
    activePersonaId,
    setActivePersonaId,
    updatePersonaSteps,
  } = useShowcaseCreation();
  
  const { 
    displayShowcase, 
    setShowcase,
    showcase
  } = useShowcaseStore();
  const { currentShowcaseSlug } = useUiStore();
  const { mutateAsync: updateShowcase, isPending: isSaving } = useUpdateShowcase(currentShowcaseSlug);
  const { selectedCredentialDefinitionIds, issuerId, tenantId } = useHelpersStore();
  const [loadedPersonaId, setLoadedPersonaId] = useState<string | null>(null);
  
  const stepsCache = useRef<typeof originalSteps>([]);
  const isCreatingNew = useRef(false);

  useEffect(() => {
    if (originalSteps.length > 0 && !isCreatingNew.current) {
      stepsCache.current = originalSteps;
    }
  }, [originalSteps]);

  const createStep = useCallback((step: StepRequest) => {
    originalCreateStep(step);
  }, [originalCreateStep]);

  const updateStep = useCallback((index: number, step: StepRequest) => {
    originalUpdateStep(index, step);
  }, [originalUpdateStep]);

  const removeStep = useCallback((index: number) => {
    originalRemoveStep(index);
  }, [originalRemoveStep]);

  const moveStep = useCallback((oldIndex: number, newIndex: number) => {
    originalMoveStep(oldIndex, newIndex);
  }, [originalMoveStep]);

  const setStepState = useCallback((newState: StepState) => {
    isCreatingNew.current = newState === 'creating-new';
    originalSetStepState(newState);
  }, [originalSetStepState]);

  const loadPersonaSteps = useCallback(
    (personaId: string) => {
      if (personaId && personaScenarios.has(personaId)) {
        const scenario = personaScenarios.get(personaId)!

        const onboardingSteps = scenario.steps.map((step, index) => {
          const baseStep = {
            id: `step-${index}`,
            order: index,
            type: step.type,
            actions: step.actions || [],
            asset: step.asset || '',
          }

          if (step.type === StepType.Service) {
            return {
              ...createServiceStep({
                title: step.title,
                description: step.description,
                asset: step.asset || '',
                credentials: (step as StepRequestUIActionTypes).credentials || [],
              }),
              ...baseStep,
            }
          } 

          return {
            ...createDefaultStep({
              title: step.title,
              description: step.description,
              asset: step.asset || '',
            }),
            ...baseStep,
          }
        })

        initializeScreens(onboardingSteps)
        setLoadedPersonaId(personaId)
      }
    },
    [personaScenarios, initializeScreens],
  )

  useEffect(() => {
    if (activePersonaId !== loadedPersonaId) {
      loadPersonaSteps(activePersonaId!)
    }
  }, [activePersonaId, loadedPersonaId, loadPersonaSteps])

  useEffect(() => {
    if (activePersonaId && loadedPersonaId === activePersonaId && stepsCache.current.length > 0) {
      const scenarioSteps = stepsCache.current.map((step, index) => {
        const baseStep = {
          title: step.title,
          description: step.description,
          order: index,
          type: step.type as StepType,
          actions: step.actions || [],
          issuer: issuerId,
          asset: step.asset || undefined,
        }

        if (step.type === StepType.Service) {
          const serviceStep = step as StepRequestUIActionTypes
          return {
            ...baseStep,
            credentials: serviceStep.credentials || [],
          }
        }

        return baseStep
      })

      updatePersonaSteps(activePersonaId, scenarioSteps as StepRequestUIActionTypes[])
    }
  }, [stepsCache.current, activePersonaId, loadedPersonaId, updatePersonaSteps, issuerId]);
  
  const saveShowcase = useCallback(async (data: ShowcaseRequest) => {
    try {
      const showcaseData = {
        name: data.name,
        description: data.description,
        status: data.status || "ACTIVE",
        hidden: data.hidden || false,
        scenarios: showcase.scenarios,
        credentialDefinitions: selectedCredentialDefinitionIds,
        personas: selectedPersonas.map((p: Persona) => p.id),
        bannerImage: data.bannerImage,
        tenantId,
      };
      
      const updatedShowcase = await updateShowcase(showcaseData);      
      setShowcase(showcaseData);
      return updatedShowcase;
    } catch (error) {
      console.error("Error saving showcase:", error);
      throw error;
    }
  }, [displayShowcase, selectedPersonas, setShowcase, showcase, selectedCredentialDefinitionIds, updateShowcase, tenantId]);

  const activePersona = activePersonaId ? selectedPersonas.find((p: Persona) => p.id === activePersonaId) || null : null

  const handleSelectStep = useCallback((index: number) => {
    setSelectedStep(index);
    const stepType = stepsCache.current[index]?.type;
    originalSetStepState(stepType === StepType.Service ? 'editing-issue' : 'editing-basic');
  }, [originalSetStepState, setSelectedStep]);

  return {
    steps: isCreatingNew.current ? stepsCache.current : originalSteps,
    selectedStep,
    createStep,
    updateStep,
    removeStep,
    moveStep,
    setStepState,
    stepState,
    handleSelectStep,
    setSelectedStep,
    personas: selectedPersonas,
    activePersonaId,
    setActivePersonaId,
    activePersona,
    saveShowcase,
    isSaving
  };
};