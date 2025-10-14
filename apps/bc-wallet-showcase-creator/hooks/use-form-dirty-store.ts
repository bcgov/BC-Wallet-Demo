import { create } from 'zustand'

interface FormDirtyState {
  isDirty: boolean
  isImageDirty: boolean
  setDirty: (dirty: boolean) => void
  setImageDirty: (dirty: boolean) => void
  reset: () => void
}

export const useFormDirtyStore = create<FormDirtyState>((set) => ({
  isDirty: false,
  isImageDirty: false,
  setDirty: (dirty) => set({ isDirty: dirty }),
  setImageDirty: (dirty) => set({ isImageDirty: dirty }),
  reset: () => set({ isDirty: false, isImageDirty: false }),
}))
