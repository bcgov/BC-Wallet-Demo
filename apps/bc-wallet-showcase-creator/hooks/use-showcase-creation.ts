import { useState, useCallback } from "react";
import { useShowcaseStore } from "@/hooks/use-showcases-store";
import type { 
  Persona, 
  ScenarioRequestType, 
  StepRequestType,
  AriesOOBActionRequest,
  IssuanceScenarioRequestType,
} from "@/openapi-types";
import { sampleAction } from "@/lib/steps";
import { useHelpersStore } from "@/hooks/use-helpers-store";
import { usePersonas } from "@/hooks/use-personas";
export const useShowcaseCreation = () => {
  const { 
    selectedPersonaIds,
  } = useShowcaseStore();
  const { data: personasData } = usePersonas();

  const { issuerId, selectedCredentialDefinitionIds } = useHelpersStore();
  const [personaScenarios, setPersonaScenarios] = useState(() => {
    const initialScenarios = new Map<string, IssuanceScenarioRequestType>();
    
    const personas = (personasData?.personas || []).filter(
      (persona: Persona) => selectedPersonaIds.includes(persona.id)
    );
    
    personas.forEach((persona: Persona) => {
      initialScenarios.set(persona.id, {
        name: `${persona.name}'s Journey`,
        description: `Onboarding scenario for ${persona.name}`,
        type: 'ISSUANCE',
        steps: [
          {
            title: `Meet ${persona.name}`,
            description: `Welcome to this showcase. Here you'll learn about digital credentials with ${persona.name}.`,
            order: 0,
            type: 'HUMAN_TASK',
            actions: [sampleAction],
          },
          {
            title: "Let's get started!",
            description: `BC Wallet is a new app for storing and using credentials on your smartphone. Credentials are things like IDs, licenses and diplomas. Using your BC Wallet is fast and simple. In the future it can be used online and in person. You approve every use, and share only what is needed. In this demo, you will use two credentials to prove who you are and access court materials online instead of in-person.`,
            order: 1,
            type: 'HUMAN_TASK',
            actions: [sampleAction],
          },
          {
            title: 'Install BC Wallet',
            description: `First, install the BC Wallet app onto your smartphone. Select the button below for instructions and the next step.`,
            order: 2,
            type: 'HUMAN_TASK',
            actions: [sampleAction],
          },
          {
            title: 'Connect with BC College',
            description: `Imagine, as ${persona.name}, you are logged into the BestBC College website (see below). They want to offer you a Digital Student Card. Use your BC Wallet to scan the QR code from the website.`,
            order: 3,
            type: 'HUMAN_TASK',
            actions: [
              {
                actionType: 'ARIES_OOB',
                title: 'Download BC Wallet on your phone',
                text: "To download, scan this QR code with your phone or select the app store icon below. You can also search for BC Wallet in your phone's app store.",
                proofRequest: {
                  attributes: {
                    attribute1: {
                      attributes: ["attribute1", "attribute2"],
                      restrictions: ["restriction1", "restriction2"],
                    },
                  },
                  predicates: {
                    predicate1: {
                      name: "example_name",
                      type: "example_type",
                      value: "example_value",
                      restrictions: ["restriction1", "restriction2"],
                    },
                  },
                },
              },
            ],
          },
          {
            title: 'Accept your student card',
            description: `Your wallet now has a secure and private connection with BestBC College. You should have received an offer in BC Wallet for a Student Card.\nReview what they are sending, and choose 'Accept offer'.`,
            order: 4,
            type: 'SERVICE',
            actions: [sampleAction],
          },
          {
            title: "You're all set!",
            description: `Congratulations, you’ve just received your first digital credentials. They are safely stored in your wallet and ready to be used. So, what are you waiting for? Let’s go! We're done with this step. Next, we'll explore ways you can use your credentials.`,
            order: 5,
            type: 'HUMAN_TASK',
            actions: [sampleAction],
          },
        ],
        personas: [persona.id],
        hidden: false,
        issuer: issuerId,
      })
    })

    return initialScenarios
  })
  
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
      
      const defaultScenario: ScenarioRequestType = {
        name: `${persona.name}'s Journey`,
        description: `Onboarding scenario for ${persona.name}`,
        type: "ISSUANCE",
        steps: [
          {
            title: `Meet ${persona.name}`,
            description: `Welcome to this showcase. Here you'll learn about digital credentials with ${persona.name}.`,
            order: 0,
            type: "HUMAN_TASK",
            actions: []
          }
        ],
        personas: [persona.id],
        hidden: false,
        issuer: issuerId
      };
      
      const newScenarios = new Map(prevScenarios);
      newScenarios.set(persona.id, defaultScenario as IssuanceScenarioRequestType);
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