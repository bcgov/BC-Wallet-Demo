import { createSlice } from '@reduxjs/toolkit'

interface IntroductionState {
  introductionStep: string
  connectionId?: string
  isCompleted: boolean
}

const initialState: IntroductionState = {
  introductionStep: 'PICK_CHARACTER',
  connectionId: undefined,
  isCompleted: false,
}

const introductionSlice = createSlice({
  name: 'introduction',
  initialState,
  reducers: {
    completeOnboarding(state) {
      state.isCompleted = true
    },
    setOnboardingStep(state, action) {
      state.introductionStep = action.payload
    },
    setOnboardingConnectionId(state, action) {
      state.connectionId = action.payload
    },
    resetOnboarding(state) {
      state.connectionId = undefined
      state.introductionStep = 'PICK_CHARACTER'
      state.isCompleted = false
    },
  },
})

export const { completeOnboarding, setOnboardingStep, setOnboardingConnectionId, resetOnboarding } =
  introductionSlice.actions

export default introductionSlice.reducer
