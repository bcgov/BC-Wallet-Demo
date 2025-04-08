import { useEffect, useState, useCallback } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useShowcaseCreation } from "@/hooks/use-showcase-creation";
import { StepRequestType } from "@/openapi-types";
import { createDefaultStep, createServiceStep, StepWithCredentials } from "@/lib/steps";
import { useShowcaseStore } from "@/hooks/use-showcases-store";
import { useHelpersStore } from "./use-helpers-store";
import { useUiStore } from "./use-ui-store";
import { useUpdateShowcase } from "./use-showcases";
import { StepType } from "@/types";
import { Persona, ShowcaseRequest } from "bc-wallet-openapi";

export const useOnboardingAdapter = () => {
  const {
    screens: steps,
    selectedStep,
    initializeScreens,
    createStep,
    updateStep,
    removeStep,
    moveStep,
    setStepState,
    stepState
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
  const { selectedCredentialDefinitionIds, issuerId } = useHelpersStore();
    
  const [loadedPersonaId, setLoadedPersonaId] = useState<string | null>(null);

  const loadPersonaSteps = useCallback((personaId: string) => {
    if (personaId && personaScenarios.has(personaId)) {
      const scenario = personaScenarios.get(personaId)!;
      
      const onboardingSteps = scenario.steps.map((step, index) => {
        const baseStep = {
          id: `step-${index}`,
          order: index,
          type: step.type,
          actions: step.actions || [],
          asset: step.asset || ""
        };

        if (step.type === StepType.SERVICE) {
          return {
            ...createServiceStep({
              title: step.title,
              description: step.description,
              asset: step.asset || "",
              credentials: (step as StepWithCredentials).credentials || []
            }),
            ...baseStep
          };
        } else {
          return {
            ...createDefaultStep({
              title: step.title,
              description: step.description,
              asset: step.asset || ""
            }),
            ...baseStep
          };
        }
      });
      
      initializeScreens(onboardingSteps);
      setLoadedPersonaId(personaId);
    }
  }, [personaScenarios, initializeScreens]);
  
  useEffect(() => {
    if (activePersonaId !== loadedPersonaId) {
      loadPersonaSteps(activePersonaId!);
    }
  }, [activePersonaId, loadedPersonaId, loadPersonaSteps]);
  
  useEffect(() => {
    if (activePersonaId && loadedPersonaId === activePersonaId && steps.length > 0) {
      const scenarioSteps: StepRequestType[] = steps.map((step, index) => {
        const baseStep = {
          title: step.title,
          description: step.description,
          order: index,
          type: step.type as 'HUMAN_TASK' | 'SERVICE' | 'SCENARIO',
          actions: step.actions || [],
          issuer: issuerId,
          asset: step.asset || ""
        };

        if (step.type === StepType.SERVICE) {
          const serviceStep = step as StepWithCredentials;
          return {
            ...baseStep,
            credentials: serviceStep.credentials || []
          };
        }

        return baseStep;
      });
      
      updatePersonaSteps(activePersonaId, scenarioSteps);
    }
  }, [steps, activePersonaId, loadedPersonaId, updatePersonaSteps, issuerId]);
  
  // TODO: create persona adapter for the persona logic 
  // TODO: move this to use-showcase-adapter.ts
  // TODO: create addPersonaToShowcase mutation
  const saveShowcase = useCallback(async (data: ShowcaseRequest) => {
    try {
      const showcaseData = {
        name: data.name,
        description: data.description,
        status: data.status || "PENDING",
        hidden: data.hidden || false,
        scenarios: showcase.scenarios,
        credentialDefinitions: selectedCredentialDefinitionIds,
        personas: selectedPersonas.map((p: Persona) => p.id),
        bannerImage: data.bannerImage,
        tenantId: data.tenantId,
      };
      // Maybe create a addIssuanceScenarioToShowcase mutation
      // that retrieves the showcase and adds the issuance scenario to it
      // and then updates the showcase
      
      const updatedShowcase = await updateShowcase(showcaseData);      
      setShowcase(showcaseData);
      return updatedShowcase;
    } catch (error) {
      console.error("Error saving showcase:", error);
      throw error;
    }
  }, [displayShowcase, selectedPersonas, setShowcase, showcase, selectedCredentialDefinitionIds]);
  
  const activePersona = activePersonaId 
    ? selectedPersonas.find((p: Persona) => p.id === activePersonaId) || null
    : null;
  
  return {
    // From onboarding
    steps,
    selectedStep,
    createStep,
    updateStep,
    removeStep,
    moveStep,
    setStepState,
    stepState,
    
    // From showcase creation
    personas: selectedPersonas,
    activePersonaId,
    setActivePersonaId,
    activePersona,
    
    // Combined functionality
    saveShowcase,
    isSaving
  };
};