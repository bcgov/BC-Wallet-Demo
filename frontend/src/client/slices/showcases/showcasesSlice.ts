import type { Showcase } from '../types'
import type { PayloadAction } from '@reduxjs/toolkit'

import { createSlice } from '@reduxjs/toolkit'

import { getOrCreateCredDefId } from '../../api/CredentialApi'

import { fetchAllShowcases, fetchShowcaseById } from './showcasesThunks'

interface ShowcasesState {
  showcases: Showcase[]
  uploadedShowcase?: Showcase
  currentShowcase?: Showcase
  isUploading: boolean
  isLoading: boolean
}

const initialState: ShowcasesState = {
  showcases: [],
  uploadedShowcase: undefined,
  currentShowcase: undefined,
  isUploading: false,
  isLoading: false,
}

const showcaseSlice = createSlice({
  name: 'showcase',
  initialState,
  reducers: {
    uploadShowcase: (state, action: PayloadAction<{ showcase: Showcase; callback?: () => void }>) => {
      state.uploadedShowcase = action.payload.showcase
      const promises: Promise<any>[] = []
      state.isUploading = true
      action.payload.showcase.credentials.forEach((cred) => {
        if (typeof cred === 'string') {
          console.warn(`uploadShowcase: credential "${cred}" is a string ID, not a hydrated Credential object. Skipping getOrCreateCredDefId.`)
          return
        }
        promises.push(getOrCreateCredDefId(cred))
      })
      Promise.all(promises).then(() => {
        if (action.payload.callback) {
          action.payload.callback()
        }
      })
    },
    setUploadingStatus: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload
    },
    setShowcase: (state, action: PayloadAction<Showcase>) => {
      state.currentShowcase = action.payload
    },
    removeShowcase: (state) => {
      state.currentShowcase = undefined
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllShowcases.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchAllShowcases.fulfilled, (state, action) => {
        state.isLoading = false
        state.showcases = action.payload
      })
      .addCase(fetchShowcaseById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchShowcaseById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentShowcase = action.payload
      })
  },
})

export const { setShowcase, removeShowcase, uploadShowcase, setUploadingStatus } = showcaseSlice.actions

export default showcaseSlice.reducer
