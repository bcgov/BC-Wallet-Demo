import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ShowcaseStatus } from "bc-wallet-openapi";
import type { ShowcaseRequest, Showcase } from "bc-wallet-openapi";

interface ShowcaseStore {
  showcase: ShowcaseRequest;  
  
  selectedPersonaIds: string[];
  selectedCredentialDefinitionIds: string[];
  currentShowcaseSlug: string;

  setShowcase: (showcase: ShowcaseRequest) => void;
  setShowcaseFromResponse: (showcase: Showcase) => void;
  setPersonaIds: (personaIds: string[]) => void;
  setScenarioIds: (scenarioIds: string[]) => void;
  
  setSelectedPersonaIds: (ids: string[]) => void;
  clearSelectedPersonas: () => void;
  
  setCredentialDefinitionIds: (ids: string[]) => void;
  setSelectedCredentialDefinitionIds: (ids: string[]) => void;
  toggleSelectedCredentialDefinition: (definitionId: string) => void;
  clearSelectedCredentialDefinitions: () => void;
  setCurrentShowcaseSlug: (currentShowcaseSlug: string) => void;
  
  reset: () => void;
}

const initialState = {
  showcase: {
    name: "",
    description: "",
    status: ShowcaseStatus.Active,
    hidden: false,
    scenarios: [],
    personas: [],
    tenantId: "",
    bannerImage: "",
  },
  currentShowcaseSlug: "",
  selectedPersonaIds: [] as string[],
  selectedCredentialDefinitionIds: [] as string[],
};

export const useShowcaseStore = create<ShowcaseStore>()(
  persist(
    (set) => ({
      ...initialState,

      setShowcase: (showcase: ShowcaseRequest) => set((state) => ({
        showcase: { ...state.showcase, ...showcase },
      })),

      setShowcaseFromResponse: (showcase: Showcase) => set((state) => ({
        showcase: { 
          ...state.showcase, 
          tenantId: showcase.tenantId, 
          slug: showcase.slug, 
          name: showcase.name, 
          completionMessage: showcase.completionMessage,
          description: showcase.description,
          status: showcase.status,
          hidden: showcase.hidden,
          personas: showcase.personas.map(p => p.id),
          scenarios: showcase.scenarios.map(s => s.id),
          bannerImage: showcase.bannerImage?.id,
        }
      })),
      
      setPersonaIds: (personaIds) => set((state) => ({
        showcase: { ...state.showcase, personas: personaIds }
      })),

      setScenarioIds: (scenarioIds) => set((state) => ({
        showcase: {
          ...state.showcase, 
          scenarios: scenarioIds.length === 0 ? [] : [
            ...state.showcase.scenarios ?? [],
            ...scenarioIds
          ] 
        }
      })),
      
      setSelectedPersonaIds: (ids) => set({ selectedPersonaIds: ids }),
      clearSelectedPersonas: () => set({ selectedPersonaIds: [] }),
      
      setCredentialDefinitionIds: (ids) => set((state) => ({
        showcase: { ...state.showcase, credentialDefinitions: ids }
      })),
      
      setSelectedCredentialDefinitionIds: (ids) => set({ selectedCredentialDefinitionIds: ids }),

      toggleSelectedCredentialDefinition: (definitionId) => set((state) => {
        const newSelectedIds = state.selectedCredentialDefinitionIds.includes(definitionId)
          ? state.selectedCredentialDefinitionIds.filter(id => id !== definitionId)
          : [...state.selectedCredentialDefinitionIds, definitionId];
        
        return { selectedCredentialDefinitionIds: newSelectedIds };
      }),
      
      clearSelectedCredentialDefinitions: () => set({ selectedCredentialDefinitionIds: [] }),
      
      setCurrentShowcaseSlug: (currentShowcaseSlug: string) => set({ currentShowcaseSlug }),

      reset: () => set(initialState),
    }),
    { 
      name: 'showcase-store'
    }
  )
);