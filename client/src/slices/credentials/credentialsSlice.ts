import type { RevocationRecord } from '../types'
import type { SerializedError } from '@reduxjs/toolkit'

import { createSlice, isAnyOf } from '@reduxjs/toolkit'

import { fetchCredentialById, issueCredential, issueDeepCredential, deleteCredentialById } from './credentialsThunks'

interface CredentialState {
  issuedCredentials: string[]
  revokableCredentials: RevocationRecord[]
  isLoading: boolean
  isIssueCredentialLoading: boolean
  error: SerializedError | undefined
}

const initialState: CredentialState = {
  issuedCredentials: [],
  revokableCredentials: [],
  isLoading: true,
  isIssueCredentialLoading: true,
  error: undefined,
}

const credentialSlice = createSlice({
  name: 'credentials',
  initialState,
  reducers: {
    clearCredentials: () => {
      // state.credentials.map((x) => isCredIssued(x.state) && state.issuedCredentials.push(x))
      // state.credentials = []
    },
    setCredential: (state, action) => {
      const credentialData = action.payload
      const credDefParts = credentialData.credential_definition_id.split(':')
      const credName = credDefParts[credDefParts.length - 1]
      if (!state.issuedCredentials.includes(credName)) {
        state.issuedCredentials.push(credName)
      }
      if (!state.revokableCredentials.map((rev) => rev.revocationRegId).includes(credentialData.revoc_reg_id)) {
        state.revokableCredentials.push({
          revocationRegId: credentialData.revoc_reg_id,
          connectionId: credentialData.connection_id,
          credRevocationId: credentialData.revocation_id,
        })
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(issueCredential.rejected, (state, action) => {
        state.isIssueCredentialLoading = false
        state.error = action.error
      })
      .addCase(issueCredential.pending, (state) => {
        state.isIssueCredentialLoading = true
      })
      .addCase(issueCredential.fulfilled, (state) => {
        state.isIssueCredentialLoading = false
      })
      .addCase(fetchCredentialById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchCredentialById.fulfilled, (state) => {
        state.isLoading = false
        // const index = state.credentials.findIndex((cred) => cred.id == action.payload.id)

        // if (index == -1) {
        //   state.credentials.push(action.payload)
        //   return state
        // }

        // state.credentials[index] = action.payload
        return state
      })
      .addCase(deleteCredentialById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(deleteCredentialById.fulfilled, (state) => {
        state.isLoading = false
        // state.credentials.filter((cred) => cred.id !== action.payload)
        return state
      })
      .addCase('clearUseCase', (state) => {
        // state.credentials.map((x) => isCredIssued(x.state) && state.issuedCredentials.push(x))
        // state.credentials = []
        state.isLoading = false
      })
      .addMatcher(isAnyOf(issueCredential.pending, issueDeepCredential.pending), (state) => {
        state.isIssueCredentialLoading = true
      })
      .addMatcher(isAnyOf(issueCredential.fulfilled, issueDeepCredential.fulfilled), (state) => {
        state.isIssueCredentialLoading = false
      })
      .addMatcher(isAnyOf(issueCredential.rejected, issueDeepCredential.rejected), (state, action) => {
        state.isIssueCredentialLoading = false
        state.error = action.error
      })
  },
})

export const { clearCredentials, setCredential } = credentialSlice.actions

export default credentialSlice.reducer
