import { create } from 'zustand';
import type { Scenario, ScenarioStep} from '@/types';
import { RequestType, StepType } from '@/types';
import { useShowcaseStore } from './use-showcase-store';
import { produce } from 'immer';

type ScenarioStepState = 
  | "none-selected" 
  | "adding-step" 
  | "basic-step-edit" 
  | "proof-step-edit" 
  | "editing-scenario"
  | "viewing-scenario" 
  | "editing-issue" 
  | null;

interface State {
  scenarios: Scenario[];
  selectedScenario: number | null;
  selectedStep: number | null;
  stepState: ScenarioStepState;
  relyingPartyId: string;
}

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

interface Actions {
  setScenarios: (scenarios: Scenario[]) => void;
  setSelectedScenario: (index: number | null) => void;
  setSelectedStep: (index: number | null) => void;
  setStepState: (state: ScenarioStepState) => void;
  
  viewScenario: (index: number) => void;
  editScenario: (index: number) => void;
  addScenario: (scenario: Omit<Scenario, 'id'>) => void;
  updateScenario: (index: number, scenario: Scenario) => void;
  removeScenario: (index: number) => void;
  
  addStep: (scenarioIndex: number, step: Omit<ScenarioStep, 'id'>) => void;
  updateStep: (scenarioIndex: number, stepIndex: number, step: ScenarioStep) => void;
  removeStep: (scenarioIndex: number, stepIndex: number) => void;
  moveStep: (scenarioIndex: number, oldIndex: number, newIndex: number) => void;

  setRelyingPartyId: (id: string) => void;
  
  reset: () => void;
}

const updateShowcaseStore = (scenarios: Scenario[]) => {
  const { selectedCharacter } = useShowcaseStore.getState();
  useShowcaseStore.setState(state => ({
    ...state,
    showcaseJSON: {
      ...state.showcaseJSON,
      personas: state.showcaseJSON.personas.map((persona, idx) =>
        idx === selectedCharacter
          ? { ...persona, scenarios }
          : persona
      ),
    },
  }));
};

export const useScenarios = create<State & Actions>((set, get) => ({
  scenarios: [],
  selectedScenario: null,
  selectedStep: null,
  stepState: null,
  relyingPartyId: "",

  setScenarios: (scenarios) => set({ scenarios }),

  setRelyingPartyId: (id) => set({ relyingPartyId: id }),

  setSelectedScenario: (index) => set({ selectedScenario: index }),

  setSelectedStep: (index) => {
    set({ selectedStep: index });
  },
  
  setStepState: (state) => {
    set({ stepState: state });
  },

  viewScenario: (index) => set({
    selectedScenario: index,
    selectedStep: null,
    stepState: "viewing-scenario"
  }),

  editScenario: (index) => set({
    selectedScenario: index,
    selectedStep: null,
    stepState: "editing-scenario"
  }),

  addScenario: (scenario) => {
    const { scenarios } = get();
    const newScenario = {
      ...scenario,
      id: Date.now().toString(),
    };
    
    const newScenarios = [...scenarios, newScenario];
    set({ scenarios: newScenarios });
    updateShowcaseStore(newScenarios);
  },

  updateScenario: (index, scenario) => {
    const { scenarios } = get();
    const newScenarios = [...scenarios];
    newScenarios[index] = { ...scenario };
    
    set({ 
      scenarios: newScenarios,
      selectedScenario: null,
      stepState: "none-selected"
    });
    updateShowcaseStore(newScenarios);
  },

  removeScenario: (index) => {
    const { scenarios, selectedScenario } = get();
    const newScenarios = scenarios.filter((_, i) => i !== index);
    
    set({
      scenarios: newScenarios,
      selectedScenario: selectedScenario === index ? null : selectedScenario,
      stepState: selectedScenario === index ? null : get().stepState,
    });
    updateShowcaseStore(newScenarios);
  },

  addStep: (scenarioIndex, step) => {
    const { scenarios } = get();
    const newScenarios = [...scenarios];
    const newStep = {
      ...step,
      id: Date.now().toString(),
    };
    
    newScenarios[scenarioIndex] = {
      ...newScenarios[scenarioIndex],
      steps: [...newScenarios[scenarioIndex].steps, newStep],
    };
    
    set({
      scenarios: newScenarios,
      selectedStep: newScenarios[scenarioIndex].steps.length - 1,
      stepState: step.type === "SERVICE" ? "proof-step-edit" : "basic-step-edit"
    });
    
    updateShowcaseStore(newScenarios);
  },

  updateStep: (scenarioIndex, stepIndex, step) => {
    const { scenarios } = get();
    const newScenarios = [...scenarios];
    const newSteps = [...newScenarios[scenarioIndex].steps];
    newSteps[stepIndex] = { ...step };
    
    newScenarios[scenarioIndex] = {
      ...newScenarios[scenarioIndex],
      steps: newSteps,
    };
    console.log('newScenariosnewScenarios',newScenarios);
    set({ scenarios: newScenarios });
    updateShowcaseStore(newScenarios);
  },

  removeStep: (scenarioIndex, stepIndex) => {
    const { scenarios, selectedStep } = get();
    const newScenarios = [...scenarios];
    const newSteps = newScenarios[scenarioIndex].steps.filter(
      (_, index) => index !== stepIndex
    );
    
    newScenarios[scenarioIndex] = {
      ...newScenarios[scenarioIndex],
      steps: newSteps,
    };
    
    set({
      scenarios: newScenarios,
      selectedStep: selectedStep === stepIndex ? null : selectedStep,
      stepState: selectedStep === stepIndex ? "none-selected" : get().stepState,
    });
    updateShowcaseStore(newScenarios);
  },

  moveStep: (scenarioIndex, oldIndex, newIndex) =>
    set(
      produce((state) => {
        const scenario = state.scenarios[scenarioIndex];
        const newSteps = [...scenario.steps];
        const [movedStep] = newSteps.splice(oldIndex, 1);
        newSteps.splice(newIndex, 0, movedStep);
        
        state.scenarios[scenarioIndex] = {
          ...scenario,
          steps: newSteps,
        };

        const { selectedCharacter } = useShowcaseStore.getState();
        useShowcaseStore.setState(
          produce((draft) => {
            draft.showcaseJSON.personas[selectedCharacter].scenarios = 
              deepClone(state.scenarios);
          })
        );
      })
    ),

  reset: () => set({
    scenarios: [],
    selectedScenario: null,
    selectedStep: null,
    stepState: null,
  }),
}));

export const createEmptyStep = (
  type: StepType
): Omit<ScenarioStep, "id"> => ({
  type: type,
  title: "",
  description: "",
  requestOptions: type === 'SERVICE'
    ? {
        type: RequestType.OOB,
        title: "",
        text: "",
        proofRequest: {
          attributes: {},
          predicates: {},
        },
      }
    : {
        type: RequestType.BASIC,
        title: "",
        text: "",
        proofRequest: {
          attributes: {},
          predicates: {},
        },
      },
});