import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ShowcaseRequestType, PersonaRequestType } from "@/openapi-types";

interface ShowcaseStore {
  showcase: ShowcaseRequestType;  
  displayShowcase: any;
  
  // Selection states
  selectedPersonaIds: string[];
  selectedCredentialDefinitionIds: string[];

  // Basic setters
  setShowcase: (showcase: ShowcaseRequestType) => void;
  setPersonaIds: (personaIds: string[]) => void;
  setDisplayPersonas: (personas: PersonaRequestType[]) => void;
  setScenarioIds: (scenarioIds: string[]) => void;
  
  // Persona selection functions
  setSelectedPersonaIds: (ids: string[]) => void;
  clearSelectedPersonas: () => void;
  
  // Credential definition functions
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
    status: "ACTIVE",
    hidden: false,
    scenarios: [],
    credentialDefinitions: [],
    personas: [],
  } as ShowcaseRequestType,
  
  displayShowcase: {
    name: "",
    description: "",
    status: "ACTIVE",
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
      setShowcase: (showcase: ShowcaseRequestType) => set((state) => ({
        showcase: { ...state.showcase, ...showcase },
        displayShowcase: { ...state.displayShowcase, ...showcase }
      })),
      
      setPersonaIds: (personaIds) => set((state) => ({
        showcase: { ...state.showcase, personas: personaIds }
      })),

      setDisplayPersonas: (personas) => set((state) => ({
        displayShowcase: { ...state.displayShowcase, personas }
      })),
      
      setScenarioIds: (scenarioIds) => set((state) => ({
        showcase: { ...state.showcase, scenarios: scenarioIds }
      })),
      
      // Persona selection functions
      setSelectedPersonaIds: (ids) => set({ selectedPersonaIds: ids }),
      clearSelectedPersonas: () => set({ selectedPersonaIds: [] }),
      
      // Credential definition functions
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