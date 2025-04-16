import { createAsyncThunk } from '@reduxjs/toolkit'
import * as Api from '../../api/CredentialApi'
import { CredentialDefinition } from '../types';

export const issueCredential = createAsyncThunk(
    'credentials/issueCredential',
    async (data: { connectionId: string, credentialDefinition: CredentialDefinition }) => {
        const response = await Api.issueCredential(data.connectionId, data.credentialDefinition)
        return response.data
    }
)

export const issueDeepCredential = createAsyncThunk(
    'credentials/issueCredential',
    async (data: { connectionId: string, credentialDefinition: CredentialDefinition }) => {
        let success = false
        let response = undefined
        while (!success) {
            try {
                response = await Api.issueDeepCredential(data.connectionId, data.credentialDefinition)
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
