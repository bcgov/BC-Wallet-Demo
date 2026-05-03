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
    completeIntroduction(state) {
      state.isCompleted = true
    },
    setIntroductionStep(state, action) {
      state.introductionStep = action.payload
    },
    setIntroductionConnectionId(state, action) {
      state.connectionId = action.payload
    },
    resetIntroduction(state) {
      state.connectionId = undefined
      state.introductionStep = 'PICK_CHARACTER'
      state.isCompleted = false
    },
  },
})

export const { completeIntroduction, setIntroductionStep, setIntroductionConnectionId, resetIntroduction } =
  introductionSlice.actions

export default introductionSlice.reducer
