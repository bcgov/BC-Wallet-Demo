import type { Showcase } from '../types'
import type { PayloadAction } from '@reduxjs/toolkit'

import { createSlice } from '@reduxjs/toolkit'

import log from '../../utils/logger'

import { fetchAllShowcases, fetchShowcaseById, fetchShowcaseBySlug } from './showcasesThunks'

interface ShowcasesState {
  showcases: Showcase[]
  uploadedShowcase?: Showcase
  currentShowcase?: Showcase
  isUploading: boolean
  isLoading: boolean
  slugLookupFailed: boolean
}

const initialState: ShowcasesState = {
  showcases: [],
  uploadedShowcase: undefined,
  currentShowcase: undefined,
  isUploading: false,
  isLoading: false,
  slugLookupFailed: false,
}

const showcaseSlice = createSlice({
  name: 'showcase',
  initialState,
  reducers: {
    uploadShowcase: (state, action: PayloadAction<{ showcase: Showcase; callback?: () => void }>) => {
      state.uploadedShowcase = action.payload.showcase
      state.isUploading = true
      action.payload.showcase.credentials.forEach((cred) => {
        if (typeof cred === 'string') {
          log.warn(
            `uploadShowcase: credential "${cred}" is a string ID, not a hydrated Credential object. Skipping getOrCreateCredDefId.`,
          )
          return
        }
      })
      if (action.payload.callback) {
        action.payload.callback()
      }
    },
    setUploadingStatus: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload
    },
    setShowcase: (state, action: PayloadAction<Showcase>) => {
      state.currentShowcase = action.payload
    },
    resetSlugLookup: (state) => {
      state.slugLookupFailed = false
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
      .addCase(fetchShowcaseBySlug.pending, (state) => {
        state.isLoading = true
        state.slugLookupFailed = false
      })
      .addCase(fetchShowcaseBySlug.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentShowcase = action.payload
      })
      .addCase(fetchShowcaseBySlug.rejected, (state) => {
        state.isLoading = false
        state.slugLookupFailed = true
      })
  },
})

export const { setShowcase, removeShowcase, uploadShowcase, setUploadingStatus, resetSlugLookup } =
  showcaseSlice.actions

export default showcaseSlice.reducer
