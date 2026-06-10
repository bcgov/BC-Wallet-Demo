import type { RevocationRecord } from '../types'
import type { SerializedError } from '@reduxjs/toolkit'

import { createSlice, isAnyOf } from '@reduxjs/toolkit'

import log from '../../utils/logger'

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
    clearCredentials: () => {},
    setCredential: (state, action) => {
      const credentialData = action.payload
      const credDefId = credentialData.by_format?.cred_issue?.anoncreds?.cred_def_id
      if (!credDefId) return
      const schemaId = credentialData.by_format?.cred_issue?.anoncreds?.schema_id
      if (!state.issuedCredentials.includes(schemaId)) {
        state.issuedCredentials.push(schemaId)
      }
      if (!state.revokableCredentials.map((rev) => rev.revocationRegId).includes(credentialData.revoc_reg_id)) {
        state.revokableCredentials.push({
          revocationRegId: credentialData.revoc_reg_id,
          connectionId: credentialData.connection_id,
          credRevocationId: credentialData.revocation_id,
          credExId: credentialData.cred_ex_id,
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
        return state
      })
      .addCase(deleteCredentialById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(deleteCredentialById.fulfilled, (state) => {
        state.isLoading = false
        return state
      })
      .addCase('clearScenario', (state) => {
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
