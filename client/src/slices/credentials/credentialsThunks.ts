import type { Credential } from '../types'

import { createAsyncThunk } from '@reduxjs/toolkit'

import * as Api from '../../api/CredentialApi'
import log from '../../utils/logger'

export const issueCredential = createAsyncThunk(
  'credentials/issueCredential',
  async (data: { connectionId: string; cred: Credential; credDefId: string }) => {
    log.debug('[credentials] issuing credential', {
      connectionId: data.connectionId,
      credName: data.cred.name,
    })
    const response = await Api.issueCredential(data.connectionId, data.cred, data.credDefId)
    log.info('[credentials] credential offered', { credentialExchangeId: response.data?.credential_exchange_id })
    return response.data
  }
)

export const issueDeepCredential = createAsyncThunk(
  'credentials/issueCredential',
  async (data: { connectionId: string; cred: Credential; credDefId: string }) => {
    log.debug('[credentials] issuing deep-link credential, polling until connection ready', {
      connectionId: data.connectionId,
      credName: data.cred.name,
    })
    let success = false
    let response = undefined
    let attempt = 0
    while (!success) {
      try {
        attempt++
        response = await Api.issueDeepCredential(data.connectionId, data.cred, data.credDefId)
        success = true
        log.info('[credentials] deep-link credential offered', {
          attempt,
          credentialExchangeId: response.data?.credential_exchange_id,
        })
      } catch {
        log.debug('[credentials] deep-link credential attempt failed, retrying', { attempt })
      }
    }
    return response?.data
  }
)

export const fetchCredentialById = createAsyncThunk('credentials/fetchById', async (id: string) => {
  log.debug('[credentials] fetching credential by id', id)
  const response = await Api.getCredentialById(id)
  return response.data
})

export const deleteCredentialById = createAsyncThunk('credentials/deleteById', async (id: string) => {
  log.debug('[credentials] deleting credential', id)
  await Api.deleteCredentialById(id)
  return id
})
