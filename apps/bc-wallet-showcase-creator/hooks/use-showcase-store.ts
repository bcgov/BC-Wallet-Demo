import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type PersonaState = "editing-persona" | "no-selection" | "creating-new";
interface State {
  editMode: boolean;
  personaState: PersonaState;
}

interface Actions {
  setEditMode: (mode: boolean) => void;
  setStepState: (state: PersonaState) => void;
  reset: () => void;
}

export const useShowcaseStore = create<State & Actions>()(
  immer((set) => ({
    editMode: false,
    personaState: "no-selection",

    setStepState: (newState) =>
      set((state) => {
        state.personaState = newState;
      }),

    setEditMode: (mode) =>
      set((state) => {
        state.editMode = mode;
      }),

    reset: () =>
      set((state) => {
        state.personaState = "no-selection";
        state.editMode = false;
      }),
  }))
);
