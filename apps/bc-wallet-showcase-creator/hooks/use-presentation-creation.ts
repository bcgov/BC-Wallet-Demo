import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { enableMapSet } from 'immer'
import { useEffect } from 'react'
import type { Persona, StepRequestType, AriesOOBActionRequest, PresentationScenarioRequestType } from '@/openapi-types'
import { sampleAction } from '@/lib/steps'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { usePersonas } from './use-personas'

enableMapSet();
// Define the interface structure for our scenarios
interface PresentationCreationState {
  // Instead of using a Map directly, we'll use a Record object for better compatibility
  personaScenariosMap: Record<string, PresentationScenarioRequestType[]>;
  activePersonaId: string | null;
  activeScenarioIndex: number;
  
  // Actions
  setActivePersonaId: (id: string | null) => void;
  setActiveScenarioIndex: (index: number) => void;
  updatePersonaSteps: (personaId: string, scenarioIndex: number, steps: StepRequestType[]) => void;
  addActionToStep: (personaId: string, stepIndex: number, action: typeof AriesOOBActionRequest._type) => void;
  addPersonaScenario: (persona: Persona, relayerId: string) => void;
  duplicateScenario: (scenarioIndex: number) => void;
  deleteScenario: (scenarioIndex: number) => void;
  addStep: (personaId: string, scenarioIndex: number, stepData: StepRequestType) => void;
  updateStep: (personaId: string, scenarioIndex: number, stepIndex: number, stepData: StepRequestType) => void;
  deleteStep: (personaId: string, scenarioIndex: number, stepIndex: number) => void;
  moveStep: (personaId: string, scenarioIndex: number, oldIndex: number, newIndex: number) => void;
  duplicateStep: (personaId: string, scenarioIndex: number, stepIndex: number) => void;
}

// Create the Zustand store with Immer middleware
const usePresentationCreationStore = create<PresentationCreationState>()(
  immer((set) => ({
    personaScenariosMap: {},
    activePersonaId: null,
    activeScenarioIndex: 0,
    
    setActivePersonaId: (id) => set(state => {
      state.activePersonaId = id;
    }),
    
    setActiveScenarioIndex: (index) => set(state => {
      state.activeScenarioIndex = index;
    }),
    
    updatePersonaSteps: (personaId, scenarioIndex, steps) => set(state => {
      if (!state.personaScenariosMap[personaId]) return;
      
      const scenarios = state.personaScenariosMap[personaId];
      if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return;
      
      scenarios[scenarioIndex].steps = steps;
    }),
    
    addActionToStep: (personaId, stepIndex, action) => set(state => {
      if (!state.personaScenariosMap[personaId]) return;
      
      const scenarios = state.personaScenariosMap[personaId];
      const scenarioIndex = state.activeScenarioIndex;
      
      if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return;
      
      const steps = scenarios[scenarioIndex].steps;
      if (stepIndex < 0 || stepIndex >= steps.length) return;
      
      const step = steps[stepIndex];
      steps[stepIndex] = { 
        ...step, 
        actions: [...(step.actions || []), action] 
      };
    }),
    
    addPersonaScenario: (persona, relayerId) => set(state => {
      if (state.personaScenariosMap[persona.id]) return;
      
      const defaultScenario: PresentationScenarioRequestType = {
        name: "You're done!",
        description: `Onboarding scenario for ${persona.name}`,
        type: 'PRESENTATION',
        steps: [
          {
            title: `Scan the QR Code to start sharing`,
            description: `Imagine, as Ana, you are logged into the BestBC College website (see below). They want to offer you a Digital Student Card. Use your BC Wallet to scan the QR code from the website.`,
            order: 0,
            type: 'HUMAN_TASK',
            actions: [
              sampleAction
            ],
          },
        ],
        personas: [persona.id],
        hidden: false,
        relyingParty: relayerId,
      };
      
      state.personaScenariosMap[persona.id] = [defaultScenario];
    }),
    
    duplicateScenario: (scenarioIndex) => set(state => {
      const personaId = state.activePersonaId;
      if (!personaId || !state.personaScenariosMap[personaId]) return;
      
      const scenarios = state.personaScenariosMap[personaId];
      if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return;
      
      const scenarioToDuplicate = scenarios[scenarioIndex];
      const duplicatedScenario = JSON.parse(JSON.stringify(scenarioToDuplicate));
      
      duplicatedScenario.name = `${duplicatedScenario.name} (Copy)`;
      
      const newScenarioIndex = scenarios.length;
      
      duplicatedScenario.steps = duplicatedScenario.steps.map((step: StepRequestType, idx: number) => ({
        ...step,
        id: `step-${newScenarioIndex}-${idx}-${Date.now()}`,
        scenarioIndex: newScenarioIndex,
      }));
      
      scenarios.push(duplicatedScenario);
    }),
    
    addStep: (personaId, scenarioIndex, stepData) => set(state => {
      if (!state.personaScenariosMap[personaId]) return;
      
      const scenarios = state.personaScenariosMap[personaId];
      if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return;
      
      const currentSteps = scenarios[scenarioIndex].steps;
      
      const newStep = {
        ...stepData,
        id: `step-${scenarioIndex}-${currentSteps.length}-${Date.now()}`,
        order: currentSteps.length,
        type: stepData.type || 'HUMAN_TASK',
        actions: stepData.actions || [],
      };
      
      scenarios[scenarioIndex].steps.push(newStep);
    }),
    
    updateStep: (personaId, scenarioIndex, stepIndex, stepData) => set(state => {
      if (!state.personaScenariosMap[personaId]) return;
      
      const scenarios = state.personaScenariosMap[personaId];
      if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return;
      
      const steps = scenarios[scenarioIndex].steps;
      if (stepIndex < 0 || stepIndex >= steps.length) return;
      
      steps[stepIndex] = {
        ...steps[stepIndex],
        ...stepData,
        order: stepIndex,
      };
    }),
    
    deleteStep: (personaId, scenarioIndex, stepIndex) => set(state => {
      if (!state.personaScenariosMap[personaId]) return;
      
      const scenarios = state.personaScenariosMap[personaId];
      if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return;
      
      const steps = scenarios[scenarioIndex].steps;
      if (stepIndex < 0 || stepIndex >= steps.length) return;
      
      // Remove the step
      steps.splice(stepIndex, 1);
      
      // Update orders for all steps
      steps.forEach((step, idx) => {
        step.order = idx;
      });
    }),
    
    moveStep: (personaId, scenarioIndex, oldIndex, newIndex) => set(state => {
      if (!state.personaScenariosMap[personaId]) return;
      
      const scenarios = state.personaScenariosMap[personaId];
      if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return;
      
      const steps = scenarios[scenarioIndex].steps;
      if (oldIndex < 0 || oldIndex >= steps.length || newIndex < 0 || newIndex >= steps.length) return;
      
      // Move the step
      const [movedStep] = steps.splice(oldIndex, 1);
      steps.splice(newIndex, 0, movedStep);
      
      // Update orders
      steps.forEach((step, idx) => {
        step.order = idx;
      });
    }),
    
    duplicateStep: (personaId, scenarioIndex, stepIndex) => set(state => {
      console.log('Duplicating step with:', { personaId, scenarioIndex, stepIndex });
      
      if (!state.personaScenariosMap[personaId]) {
        console.log('No persona found with ID:', personaId);
        return;
      }
      
      const scenarios = state.personaScenariosMap[personaId];
      if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) {
        console.log('Invalid scenario index:', scenarioIndex);
        return;
      }
      
      // Ensure we're working with the correct scenario
      const scenario = scenarios[scenarioIndex];
      const steps = scenario.steps;
      
      if (stepIndex < 0 || stepIndex >= steps.length) {
        console.log('Invalid step index:', stepIndex);
        return;
      }
      
      // Clone the step
      const stepToDuplicate = steps[stepIndex];
      console.log('Step to duplicate:', stepToDuplicate);
      
      const duplicatedStep = {
        ...JSON.parse(JSON.stringify(stepToDuplicate)),
        title: `${stepToDuplicate.title} (Copy)`,
        id: `step-${scenarioIndex}-${stepIndex}-${Date.now()}`,
        order: stepIndex + 1,
      };
      
      console.log('Created duplicated step:', duplicatedStep);
      
      // Insert after the original in the SAME scenario
      steps.splice(stepIndex + 1, 0, duplicatedStep);
      
      // Update orders for all steps
      steps.forEach((step, idx) => {
        step.order = idx;
      });
      
      console.log('Updated steps after duplication:', steps);
    }),

    deleteScenario: (scenarioIndex) => set(state => {
      const personaId = state.activePersonaId;
      if (!personaId || !state.personaScenariosMap[personaId]) return;
      
      const scenarios = state.personaScenariosMap[personaId];
      if (scenarioIndex < 0 || scenarioIndex >= scenarios.length) return; 
      
      scenarios.splice(scenarioIndex, 1);
    }),
  }))
);

// Create a custom hook to use the store
export const usePresentationCreation = () => {
  const { selectedPersonaIds } = useShowcaseStore();
  const { relayerId, selectedCredentialDefinitionIds } = useHelpersStore();
  const { data: personasData } = usePersonas();
  
  // Get store state and actions
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
  } = usePresentationCreationStore();
  
  // Initialize the store when needed
  useEffect(() => {
    const personas = (personasData?.personas || []).filter((persona: Persona) =>
      selectedPersonaIds.includes(persona.id),
    );
    
    // Initialize store with personas if needed
    personas.forEach((persona: Persona) => {
      if (!personaScenariosMap[persona.id]) {
        addPersonaScenario(persona, relayerId);
      }
    });
    
    // Set initial active persona if not already set
    if (!activePersonaId && personas.length > 0) {
      setActivePersonaId(personas[0].id);
    }
  }, [personasData, selectedPersonaIds, personaScenariosMap, activePersonaId, relayerId, addPersonaScenario, setActivePersonaId]);
  
  const selectedPersonas = (personasData?.personas || []).filter((persona: Persona) =>
    selectedPersonaIds.includes(persona.id),
  );
  
  // Convert the flat map to a Map object for API compatibility with the old hook
  const personaScenarios = new Map(
    Object.entries(personaScenariosMap)
  );
  
  return {
    selectedPersonas,
    selectedCredentialDefinitionIds,
    personaScenarios,
    activePersonaId,
    setActivePersonaId,
    updatePersonaSteps,
    addActionToStep,
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
  };
};