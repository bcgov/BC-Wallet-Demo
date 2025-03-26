import { useState, useCallback } from "react";
import { useShowcaseStore } from "@/hooks/use-showcases-store";
import type { 
  Persona, 
  StepRequestType,
  AriesOOBActionRequest,
  PresentationScenarioRequestType,
} from "@/openapi-types";
import { sampleAction } from "@/lib/steps";
import { useHelpersStore } from "@/hooks/use-helpers-store";
import { usePersonas } from "./use-personas";

export const usePresentationCreation = () => {
  const { 
    displayShowcase, 
    selectedPersonaIds,
  } = useShowcaseStore();

  const { relayerId, selectedCredentialDefinitionIds } = useHelpersStore();
  const { data: personasData } = usePersonas();

  const [ personaScenarios, setPersonaScenarios ] = useState(() => {
    const initialScenarios = new Map<string, PresentationScenarioRequestType>();
    
    const personas = (personasData?.personas || []).filter(
      (persona: Persona) => selectedPersonaIds.includes(persona.id)
    );
    
    personas.forEach((persona: Persona) => {
      initialScenarios.set(persona.id, {
        name: "University of British Columbia",
        description: `Onboarding scenario for ${persona.name}`,
        type: "PRESENTATION",
        steps: [
          {
            title: `Scan the QR Code to start sharing`,
            description: `Imagine, as Ana, you are logged into the BestBC College website (see below). They want to offer you a Digital Student Card. Use your BC Wallet to scan the QR code from the website.`,
            order: 0,
            type: "HUMAN_TASK",
            actions: [
              sampleAction,
            ]
          }
        ],
        personas: [persona.id],
        hidden: false,
        relyingParty: relayerId
      });
    });
    
    return initialScenarios;
  });
  
  const [activePersonaId, setActivePersonaId] = useState<string | null>(() => {
    const personas = (personasData?.personas || []).filter(
      (persona: Persona) => selectedPersonaIds.includes(persona.id)
    );
    return personas.length > 0 ? personas[0].id : null;
  });
  
  const selectedPersonas = (personasData?.personas || []).filter(
    (persona: Persona) => selectedPersonaIds.includes(persona.id)
  );
  
  const updatePersonaSteps = useCallback((personaId: string, steps: StepRequestType[]) => {
    setPersonaScenarios(prevScenarios => {
      if (!prevScenarios.has(personaId)) {
        return prevScenarios;
      }
      
      const newScenarios = new Map(prevScenarios);
      newScenarios.set(personaId, {
        ...prevScenarios.get(personaId)!,
        steps: steps
      });
      
      return newScenarios;
    });
  }, []);
  
  const addActionToStep = useCallback((
    personaId: string, 
    stepIndex: number, 
    action: typeof AriesOOBActionRequest._type
  ) => {
    setPersonaScenarios(prevScenarios => {
      if (!prevScenarios.has(personaId)) {
        return prevScenarios;
      }
      
      const scenario = prevScenarios.get(personaId)!;
      const steps = [...scenario.steps];
      
      if (stepIndex < 0 || stepIndex >= steps.length) {
        return prevScenarios;
      }
      
      const step = steps[stepIndex];
      const actions = [...(step.actions || []), action];
      
      steps[stepIndex] = { ...step, actions };
      
      const newScenarios = new Map(prevScenarios);
      newScenarios.set(personaId, {
        ...scenario,
        steps: steps
      });
      
      return newScenarios;
    });
  }, []);
  
  const addPersonaScenario = useCallback((persona: Persona) => {
    setPersonaScenarios(prevScenarios => {
      if (prevScenarios.has(persona.id)) {
        return prevScenarios;
      }
      
      const defaultScenario: PresentationScenarioRequestType = {
        name: "You're done!",
        description: `Onboarding scenario for ${persona.name}`,
        type: "PRESENTATION",
        steps: [
          {
            title: `Scan the QR Code to start sharing`,
            description: `Imagine, as Ana, you are logged into the BestBC College website (see below). They want to offer you a Digital Student Card. Use your BC Wallet to scan the QR code from the website.`,
            order: 0,
            type: "HUMAN_TASK",
            actions: []
          }
        ],
        personas: [persona.id],
        hidden: false,
        relyingParty: relayerId
      };
      
      const newScenarios = new Map(prevScenarios);
      newScenarios.set(persona.id, defaultScenario as PresentationScenarioRequestType);
      return newScenarios;
    });
  }, []);

  return {
    selectedPersonas,
    selectedCredentialDefinitionIds,
    personaScenarios,
    activePersonaId,
    setActivePersonaId,
    updatePersonaSteps,
    addActionToStep,
    addPersonaScenario,
    // completeShowcaseCreation,
    // isSaving: createIssuanceScenario.isPending
  };
};