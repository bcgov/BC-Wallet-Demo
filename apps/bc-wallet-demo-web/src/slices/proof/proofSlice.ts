import { createSlice } from '@reduxjs/toolkit'

import { createProof, createProofOOB, fetchProofById } from './proofThunks'

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
      .addCase(createProof.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createProof.fulfilled, (state, action) => {
        state.isLoading = false
        state.proof = { ...action.payload, id: action.payload?.presentation_exchange_id ?? '' }
      })
      .addCase(createProofOOB.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createProofOOB.fulfilled, (state, action) => {
        state.isLoading = false
        // const url = action.payload.message.split('?')[0] + '?id=' + action.payload.proofRecord.id
        state.proofUrl = action.payload.proofUrl
        state.proof = action.payload.proof
        if (action.payload.proof.presentation_exchange_id) {
          state.proof = { ...action.payload.proof, id: action.payload.proof?.presentation_exchange_id }
        }
      })
      .addCase(fetchProofById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchProofById.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload.presentation_exchange_id) {
          state.proof = { ...action.payload, id: action.payload?.presentation_exchange_id }
        }
      })
      .addCase('clearUseCase', (state) => {
        state.proof = undefined
        state.isLoading = false
      })
  },
})

export const { clearProof } = proofSlice.actions

export default proofSlice.reducer
