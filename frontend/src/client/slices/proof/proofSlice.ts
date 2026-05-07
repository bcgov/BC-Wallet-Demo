import { createSlice, isAnyOf } from '@reduxjs/toolkit'

import { createProof, createDeepProof, createProofOOB, fetchProofById } from './proofThunks'

interface ProofState {
  proof?: any
  proofUrl?: string
  isLoading: boolean
}

const initialState: ProofState = {
  proof: undefined,
  proofUrl: undefined,
  isLoading: false,
}

const proofSlice = createSlice({
  name: 'proof',
  initialState,
  reducers: {
    clearProof: (state) => {
      state.proof = undefined
      state.isLoading = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase('clearProof', (state) => {
        state.proof = undefined
      })
      .addCase(createProofOOB.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createProofOOB.fulfilled, (state, action) => {
        state.isLoading = false
        state.proofUrl = action.payload.proofUrl
        const proofId = action.payload.proof?.pres_ex_id || action.payload.proof?.presentation_exchange_id
        state.proof = { ...action.payload.proof, id: proofId || '' }
      })
      .addCase(fetchProofById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchProofById.fulfilled, (state, action) => {
        state.isLoading = false
        const proofId = action.payload?.pres_ex_id || action.payload?.presentation_exchange_id || action.payload?.id
        if (proofId) {
          state.proof = { ...action.payload, id: proofId }
        }
      })
      .addCase('clearScenario', (state) => {
        state.proof = undefined
        state.isLoading = false
      })
      .addMatcher(isAnyOf(createProof.pending, createDeepProof.pending), (state) => {
        state.isLoading = true
      })
      .addMatcher(isAnyOf(createProof.fulfilled, createDeepProof.fulfilled), (state, action) => {
        state.isLoading = false
        const proofId = action.payload?.pres_ex_id || action.payload?.presentation_exchange_id || action.payload?.id
        state.proof = { ...action.payload, id: proofId || '' }
      })
      .addMatcher(isAnyOf(createProof.rejected, createDeepProof.rejected), (state) => {
        state.isLoading = false
      })
  },
})

export const { clearProof } = proofSlice.actions

export default proofSlice.reducer
