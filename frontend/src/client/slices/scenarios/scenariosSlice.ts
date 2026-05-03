import { createSlice } from '@reduxjs/toolkit'

interface ScenarioState {
  sectionCount: number
  stepCount: number
  isLoading: boolean
}

const initialState: ScenarioState = {
  sectionCount: 0,
  stepCount: 0,
  isLoading: false,
}

const scenarioSlice = createSlice({
  name: 'scenario',
  initialState,
  reducers: {
    nextSection: (state) => {
      state.sectionCount++
      state.stepCount = 0
    },
    resetStep: (state) => {
      state.stepCount = 0
    },
    nextStep: (state) => {
      state.stepCount++
    },
    prevStep: (state) => {
      state.stepCount--
    },
  },
})

export const { nextSection, resetStep, nextStep, prevStep } = scenarioSlice.actions

export default scenarioSlice.reducer
