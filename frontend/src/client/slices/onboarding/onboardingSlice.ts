import { createSlice } from '@reduxjs/toolkit'

interface OnboardingState {
  onboardingStep: string
  connectionId?: string
  isCompleted: boolean
}

const initialState: OnboardingState = {
  onboardingStep: 'PICK_CHARACTER',
  connectionId: undefined,
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
      state.onboardingStep = action.payload
    },
    setOnboardingConnectionId(state, action) {
      state.connectionId = action.payload
    },
    resetOnboarding(state) {
      state.connectionId = undefined
      state.onboardingStep = 'PICK_CHARACTER'
      state.isCompleted = false
    },
  },
})

export const { completeOnboarding, setOnboardingStep, setOnboardingConnectionId, resetOnboarding } =
  onboardingSlice.actions

export default onboardingSlice.reducer
