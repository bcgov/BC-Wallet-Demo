import { createSlice } from '@reduxjs/toolkit'

interface UseCaseState {
  sectionCount: number
  stepCount: number
  isLoading: boolean
}

const initialState: UseCaseState = {
  sectionCount: 0,
  stepCount: 0,
  isLoading: false,
}

const useCaseSlice = createSlice({
  name: 'useCase',
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

export const { nextSection, resetStep, nextStep, prevStep } = useCaseSlice.actions

export default useCaseSlice.reducer
