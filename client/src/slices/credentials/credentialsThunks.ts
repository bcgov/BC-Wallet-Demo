import type { Credential, CredentialData } from '../types'

import { createAsyncThunk } from '@reduxjs/toolkit'

import * as Api from '../../api/CredentialApi'

export const issueCredential = createAsyncThunk(
  'credentials/issueCredential',
  async (data: { connectionId: string; cred: Credential; credDefId: string }) => {
    const response = await Api.issueCredential(data.connectionId, data.cred, data.credDefId)
    return response.data
  }
)

export const issueDeepCredential = createAsyncThunk(
  'credentials/issueCredential',
  async (data: { connectionId: string; cred: Credential; credDefId: string }) => {
    let success = false
    let response = undefined
    while (!success) {
      try {
        response = await Api.issueDeepCredential(data.connectionId, data.cred, data.credDefId)
        success = true
      } catch {
        // pass
      }
    }
    return response?.data
  }
)

export const fetchCredentialById = createAsyncThunk('credentials/fetchById', async (id: string) => {
  const response = await Api.getCredentialById(id)
  return response.data
})

export const deleteCredentialById = createAsyncThunk('credentials/deleteById', async (id: string) => {
  await Api.deleteCredentialById(id)
  return id
})
