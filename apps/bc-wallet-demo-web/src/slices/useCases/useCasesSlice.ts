import { createSlice } from '@reduxjs/toolkit'

interface UseCaseState {
  stepCount: number
  isLoading: boolean
}

const initialState: UseCaseState = {
  stepCount: 0,
  isLoading: false,
}

const useCaseSlice = createSlice({
  name: 'useCase',
  initialState,
  reducers: {
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

export const { resetStep, nextStep, prevStep } = useCaseSlice.actions //nextSection,

export default useCaseSlice.reducer
