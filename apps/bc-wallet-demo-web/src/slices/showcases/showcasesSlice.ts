import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { fetchPersonaBySlug, fetchShowcaseBySlug } from './showcasesThunks'
import type { Persona, Showcase } from '../types'

interface ShowcasesState {
  showcase?: Showcase | null
  uploadedShowcase?: Showcase
  currentPersona?: Persona | null
  isUploading: boolean
  isLoading: boolean
}

const initialState: ShowcasesState = {
  isUploading: false,
  isLoading: false,
}

const showcaseSlice = createSlice({
  name: 'showcase',
  initialState,
  reducers: {
    clearShowcase: (state) => {
      state.showcase = undefined
    },
    uploadShowcase: (state, action: PayloadAction<{ showcase: Showcase; callback?: () => void }>) => {
      state.uploadedShowcase = action.payload.showcase
      const promises: Promise<any>[] = []
      state.isUploading = true
      Promise.all(promises).then(() => {
        if (action.payload.callback) {
          action.payload.callback()
        }
      })
    },
    setUploadingStatus: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload
    },
    setPersona: (state, action: PayloadAction<any>) => {
      state.currentPersona = action.payload
    },
    removePersona: (state) => {
      state.currentPersona = undefined
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShowcaseBySlug.pending, (state): void => {
        state.isLoading = true
      })
      .addCase(fetchShowcaseBySlug.fulfilled, (state, action) => {
        state.isLoading = false
        state.showcase = action.payload
      })
      .addCase(fetchPersonaBySlug.pending, (state): void => {
        state.isLoading = true
      })
      .addCase(fetchPersonaBySlug.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentPersona = action.payload
      })
  },
})

export const { setPersona, removePersona, uploadShowcase, setUploadingStatus, clearShowcase } = showcaseSlice.actions

export default showcaseSlice.reducer
