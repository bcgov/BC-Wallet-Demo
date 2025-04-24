// @ts-nocheck
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { DEFAULT_JSON } from "@/lib/fixtures";
import type { Persona, ShowcaseJSON } from "@/types";
import type { CredentialFormData } from "@/schemas/credential";

type Tab = "Character" | "Onboarding" | "Scenario" | "Publish";
type PersonaState = "editing-persona" | "no-selection" | "creating-new";
interface State {
  showcaseJSON: ShowcaseJSON;
  selectedCharacter: number;
  currentPage: string;
  editMode: boolean;
  activeTab: Tab;
  personaState: PersonaState;
  showcaseId: string;
  personaIds: string[];
}

interface Actions {
  setShowcaseJSON: (json: ShowcaseJSON) => void;
  setSelectedCharacter: (index: number) => void;
  setEditMode: (mode: boolean) => void;
  setActiveTab: (tab: Tab) => void;
  setStepState: (state: PersonaState) => void;
  updateCharacterDetails: (data: {
    name: string;
    role: string;
    description: string;
  }) => void;
  updateCharacterImage: (
    imageType: "headshot_image" | "body_image",
    imageData: string
  ) => void;
  removeCharacter: (index: number) => void;

  // credentials
  updateCredential: (credentialId: string, data: CredentialFormData) => void;
  createCredential: (credentialId: string, data: CredentialFormData) => void;
  removeCredential: (credentialId: string) => void;
  setShowcaseId: (id: string) => void;
  setPersonaIds: (ids: string[]) => void;
  addPersonaId: (id: string) => void;
  removePersonaId: (id: string) => void;

  reset: () => void;
}

export const useShowcaseStore = create<State & Actions>()(
  immer((set) => ({
    showcaseJSON: {
      // @ts-ignore
      personas: [DEFAULT_JSON] as Persona[],
    },
    showcaseId: "",
    personaIds: [],
    selectedCharacter: 0,
    currentPage: "character",
    activeTab: "Character",
    editMode: false,
    personaState: "no-selection",

    setShowcaseId: (id) =>
      set((state) => {
        state.showcaseId = id;
      }),

    setPersonaIds: (ids) =>
      set((state) => {
        state.personaIds = ids;
      }),

    addPersonaId: (id) =>
      set((state) => {
        if (!state.personaIds.includes(id)) {
          state.personaIds.push(id);
        }
      }),

    removePersonaId: (id) =>
      set((state) => {
        state.personaIds = state.personaIds.filter(
          (personaId) => personaId !== id
        );
      }),

    setActiveTab: (tab) => {
      set((state) => {
        state.activeTab = tab;
      });
    },

    setStepState: (newState) =>
      set((state) => {
        state.personaState = newState;
      }),

    setShowcaseJSON: (json) =>
      set((state) => {
        state.showcaseJSON = json;
      }),

    setSelectedCharacter: (index) =>
      set((state) => {
        state.selectedCharacter = index;
      }),

    // Edit Mode from the form
    setEditMode: (mode) =>
      set((state) => {
        state.editMode = mode;
      }),

    // Character Details
    // those methods are temporary, to be replaced with each dedicated service
    updateCharacterDetails: ({ name, role, description }) =>
      set((state) => {
        const persona = state.showcaseJSON.personas[state.selectedCharacter];
        persona.name = name;
        persona.type = role;
        persona.description = description;
      }),

    updateCharacterImage: (imageType, imageData) =>
      set((state) => {
        state.showcaseJSON.personas[state.selectedCharacter][imageType] =
          imageData;
      }),

    removeCharacter: (index) =>
      set((state) => {
        state.showcaseJSON.personas.splice(index, 1);
        if (state.selectedCharacter === index) {
          state.selectedCharacter = 0;
        }
      }),

    // credentials
    updateCredential: (credentialId, data) =>
      set((state) => {
        const persona = state.showcaseJSON.personas[state.selectedCharacter];
        persona.credentials[credentialId] = {
          name: data.name,
          issuer_name: data.issuer_name,
          version: data.version || "",
          icon: data.icon || "",
          attributes: data.attributes,
        };
      }),

    createCredential: (credentialId, data) =>
      set((state) => {
        const persona = state.showcaseJSON.personas[state.selectedCharacter];
        persona.credentials[credentialId] = {
          name: data.name,
          issuer_name: data.issuer_name,
          version: data.version || "",
          icon: data.icon || "",
          attributes: data.attributes,
        };
      }),

    removeCredential: (credentialId) =>
      set((state) => {
        const persona = state.showcaseJSON.personas[state.selectedCharacter];
        delete persona.credentials[credentialId];
      }),

    reset: () =>
      set((state) => {
        state.showcaseJSON = { personas: [DEFAULT_JSON] as Persona[] };
        state.selectedCharacter = 0;
        state.currentPage = "character";
        state.editMode = false;
        state.showcaseId = "";
        state.personaIds = [];
      }),
  }))
);
