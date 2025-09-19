'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type PersonaState = 'editing-persona' | 'no-selection' | 'creating-new'
interface State {
  editMode: boolean
  personaState: PersonaState
  draftHeadshotImage: string | null
  draftBodyImage: string | null
}

interface Actions {
  setEditMode: (mode: boolean) => void
  setStepState: (state: PersonaState) => void
  setDraftImages: (images: { headshot?: string | null; body?: string | null }) => void
  reset: () => void
}

export const usePersonaStore = create<State & Actions>()(
  immer((set) => ({
    editMode: false,
    personaState: 'creating-new',
    draftHeadshotImage: null,
    draftBodyImage: null,

    setStepState: (newState) =>
      set((state) => {
        state.personaState = newState
      }),

    setEditMode: (mode) =>
      set((state) => {
        state.editMode = mode
      }),

    setDraftImages: ({ headshot, body }) =>
      set((state) => {
        if (headshot !== undefined) state.draftHeadshotImage = headshot
        if (body !== undefined) state.draftBodyImage = body
      }),

    reset: () =>
      set((state) => {
        state.personaState = 'creating-new'
        state.editMode = false
        state.draftHeadshotImage = null
        state.draftBodyImage = null
      }),
  })),
)
