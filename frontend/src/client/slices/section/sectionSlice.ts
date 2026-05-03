import type { ScenarioScreen } from '../types'
import type { PayloadAction } from '@reduxjs/toolkit'

import { createSlice } from '@reduxjs/toolkit'

export interface SectionState {
  section?: ScenarioScreen
}

const initialState: SectionState = {
  section: undefined,
}

const sectionSlice = createSlice({
  name: 'section',
  initialState,
  reducers: {
    setSection: (state, action: PayloadAction<ScenarioScreen>) => {
      state.section = action.payload
    },
    clearSection: (state) => {
      state.section = undefined
    },
  },
  extraReducers: (builder) => {
    builder.addCase('clearScenario', (state) => {
      state.section = undefined
    })
  },
})

export const { setSection, clearSection } = sectionSlice.actions

export default sectionSlice.reducer
