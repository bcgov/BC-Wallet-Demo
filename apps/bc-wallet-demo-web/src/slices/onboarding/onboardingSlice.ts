import { createSlice } from '@reduxjs/toolkit'

import type { Scenario, Step } from '../types'

interface OnboardingState {
  scenario?: Scenario
  isCompleted: boolean
  currentStep?: Step
}

const initialState: OnboardingState = {
  isCompleted: false,
}

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    completeOnboarding(state) {
      state.isCompleted = true
    },
    setOnboardingStep(state, action) {
      state.currentStep = action.payload
    },
    setScenario(state, action) {
      state.scenario = action.payload
    },
    resetOnboarding(state) {
      state.scenario = undefined
      state.currentStep = undefined
      state.isCompleted = false
    },
  },
})

export const { completeOnboarding, setOnboardingStep, setScenario } = onboardingSlice.actions

export default onboardingSlice.reducer
