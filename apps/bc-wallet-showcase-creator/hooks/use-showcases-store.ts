import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ShowcaseStatus } from "bc-wallet-openapi";
import type { ShowcaseRequest, PersonaRequest, Showcase } from "bc-wallet-openapi";

interface ShowcaseStore {
  showcase: ShowcaseRequest;  
  showcaseResponse: Showcase;  
  displayShowcase: any;
  
  selectedPersonaIds: string[];
  selectedCredentialDefinitionIds: string[];

  setShowcase: (showcase: ShowcaseRequest) => void;
  setShowcaseFromResponse: (showcase: Showcase) => void;
  setPersonaIds: (personaIds: string[]) => void;
  setDisplayPersonas: (personas: PersonaRequest[]) => void;
  setScenarioIds: (scenarioIds: string[]) => void;
  
  setSelectedPersonaIds: (ids: string[]) => void;
  clearSelectedPersonas: () => void;
  
  setCredentialDefinitionIds: (ids: string[]) => void;
  setDisplayCredentialDefinitions: (definitions: any[]) => void;
  setSelectedCredentialDefinitionIds: (ids: string[]) => void;
  toggleSelectedCredentialDefinition: (definitionId: string) => void;
  clearSelectedCredentialDefinitions: () => void;
  
  reset: () => void;
}

const initialState = {
  showcase: {
    name: "",
    description: "",
    status: ShowcaseStatus.Active,
    hidden: false,
    scenarios: [],
    credentialDefinitions: [],
    personas: [],
    tenantId: "test-tenant-1",
  },

  showcaseResponse: {
    id: "",
    tenantId: "",
    slug: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    name: "",
    description: "",
    status: ShowcaseStatus.Active,
    hidden: false,
    scenarios: [],
    credentialDefinitions: [],
    personas: [],
    bannerImage: undefined,
    completionMessage: "",
    createdBy: undefined,
  },
  
  displayShowcase: {
    name: "",
    description: "",
    status: ShowcaseStatus.Active,
    hidden: false,
    scenarios: [],
    credentialDefinitions: [{
      "name": "example_name",
      "credentialSchema": {
        "name": "example_name",
        "version": "example_version",
        "identifierType": "DID",
        "identifier": "did:sov:XUeUZauFLeBNofY3NhaZCB",
        "source": "CREATED",
        "attributes": [
          {
            "name": "example_attribute_name1",
            "value": "example_attribute_value1",
            "type": "STRING"
          }
        ]
      },
      "identifierType": "DID",
      "identifier": "did:sov:XUeUZauFLeBNofY3NhaZCB",
      "version": "example_version",
      "type": "ANONCRED",
      "representations": []
    }],
    personas: [],
  },

  selectedPersonaIds: [] as string[],
  selectedCredentialDefinitionIds: [] as string[],
};

export const useShowcaseStore = create<ShowcaseStore>()(
  persist(
    (set) => ({
      ...initialState,

      setShowcase: (showcase: ShowcaseRequest) => set((state) => ({
        showcase: { ...state.showcase, ...showcase },
        displayShowcase: { ...state.displayShowcase, ...showcase }
      })),

      setShowcaseFromResponse: (showcase: Showcase) => set((state) => ({
        showcaseResponse: { ...state.showcaseResponse, ...showcase },
        displayShowcase: { ...state.displayShowcase, ...showcase }
      })),
      
      setPersonaIds: (personaIds) => set((state) => ({
        showcase: { ...state.showcase, personas: personaIds }
      })),

      setDisplayPersonas: (personas) => set((state) => ({
        displayShowcase: { ...state.displayShowcase, personas }
      })),
      
      setScenarioIds: (scenarioIds) => set((state) => ({
        showcase: { ...state.showcase, scenarios:  scenarioIds.length === 0 ? [] : [...state.showcase.scenarios ?? [] , ...scenarioIds] }
      })),
      
      setSelectedPersonaIds: (ids) => set({ selectedPersonaIds: ids }),
      clearSelectedPersonas: () => set({ selectedPersonaIds: [] }),
      
      setCredentialDefinitionIds: (ids) => set((state) => ({
        showcase: { ...state.showcase, credentialDefinitions: ids }
      })),
      
      setDisplayCredentialDefinitions: (definitions) => set((state) => ({
        displayShowcase: { ...state.displayShowcase, credentialDefinitions: definitions }
      })),
      
      setSelectedCredentialDefinitionIds: (ids) => set({ selectedCredentialDefinitionIds: ids }),
      
      toggleSelectedCredentialDefinition: (definitionId) => set((state) => {
        const newSelectedIds = state.selectedCredentialDefinitionIds.includes(definitionId)
          ? state.selectedCredentialDefinitionIds.filter(id => id !== definitionId)
          : [...state.selectedCredentialDefinitionIds, definitionId];
        
        return { selectedCredentialDefinitionIds: newSelectedIds };
      }),
      
      clearSelectedCredentialDefinitions: () => set({ selectedCredentialDefinitionIds: [] }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'showcase-store',
    }
  )
);