import type { PayloadAction } from '@reduxjs/toolkit'

import { createSlice } from '@reduxjs/toolkit'

import { fetchLastServerReset } from './preferencesThunks'

interface PreferencesState {
  darkMode: boolean
  showHiddenScenarios: boolean
  revocationEnabled: boolean
  showcaseUploadEnabled: boolean
  completedScenarioSlugs: string[]
  demoCompleted: boolean
  completeCanceled: boolean
  connectionDate?: string
  lastServerReset?: string
}

const initialState: PreferencesState = {
  darkMode: false,
  showHiddenScenarios: false,
  revocationEnabled: false,
  showcaseUploadEnabled: false,
  completedScenarioSlugs: [],
  demoCompleted: false,
  completeCanceled: false,
  connectionDate: undefined,
  lastServerReset: undefined,
}

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setDarkMode: (state, action) => {
      localStorage.setItem('theme', action.payload ? 'dark' : 'light')

      if (action.payload) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      state.darkMode = action.payload ?? !state.darkMode
    },
    setConnectionDate: (state, action) => {
      state.connectionDate = action.payload
    },
    scenarioCompleted: (state, action: PayloadAction<string>) => {
      if (!state.completedScenarioSlugs.includes(action.payload)) {
        state.completedScenarioSlugs.push(action.payload)
      }
      state.completeCanceled = false
    },
    toggleHiddenScenarios: (state) => {
      state.showHiddenScenarios = !state.showHiddenScenarios
    },
    setDemoCompleted: (state, val) => {
      state.demoCompleted = val.payload
    },
    resetDashboard: (state) => {
      state.completedScenarioSlugs = []
    },
    toggleRevocation: (state) => {
      state.revocationEnabled = !state.revocationEnabled
    },
    toggleShowcaseUpload: (state) => {
      state.showcaseUploadEnabled = !state.showcaseUploadEnabled
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase('demo/RESET', (state) => {
        state.darkMode = localStorage.getItem('theme') === 'dark'
        state.connectionDate = undefined
      })
      .addCase(fetchLastServerReset.fulfilled, (state, action) => {
        state.lastServerReset = action.payload
      })
  },
})

export const {
  setDarkMode,
  toggleHiddenScenarios,
  scenarioCompleted,
  resetDashboard,
  setDemoCompleted,
  setConnectionDate,
  toggleRevocation,
  toggleShowcaseUpload,
} = preferencesSlice.actions

export default preferencesSlice.reducer
