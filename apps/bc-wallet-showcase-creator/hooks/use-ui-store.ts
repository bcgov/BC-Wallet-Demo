import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiStore {
  currentShowcaseSlug: string;
  setCurrentShowcaseSlug: (currentShowcaseSlug: string) => void;
  reset: () => void;
}

const initialState = {
  currentShowcaseSlug: "",
};

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      ...initialState,
      setCurrentShowcaseSlug: (currentShowcaseSlug: string) => set({ currentShowcaseSlug }),
      reset: () => set(initialState),
    }),
    {
      name: 'ui-store',
    }
  )
);