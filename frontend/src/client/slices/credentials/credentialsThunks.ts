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
  },
)

const DEEP_CRED_MAX_ATTEMPTS = 10
const DEEP_CRED_BASE_DELAY_MS = 500

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

export const issueDeepCredential = createAsyncThunk(
  'credentials/issueDeepCredential',
  async (data: { connectionId: string; cred: Credential; credDefId: string }, thunkAPI) => {
    log.debug('[credentials] issuing deep-link credential, polling until connection ready', {
      connectionId: data.connectionId,
      credName: data.cred.name,
    })
    for (let attempt = 1; attempt <= DEEP_CRED_MAX_ATTEMPTS; attempt++) {
      if (thunkAPI.signal.aborted) {
        return thunkAPI.rejectWithValue('Cancelled')
      }
      try {
        const response = await Api.issueDeepCredential(data.connectionId, data.cred, data.credDefId)
        log.info('[credentials] deep-link credential offered', {
          attempt,
          credentialExchangeId: response.data?.credential_exchange_id,
        })
        return response.data
      } catch {
        log.debug('[credentials] deep-link credential attempt failed', { attempt, maxAttempts: DEEP_CRED_MAX_ATTEMPTS })
        if (attempt < DEEP_CRED_MAX_ATTEMPTS) {
          await sleep(DEEP_CRED_BASE_DELAY_MS * 2 ** (attempt - 1), thunkAPI.signal)
        }
      }
    }
    log.error('[credentials] deep-link credential failed after max attempts', { maxAttempts: DEEP_CRED_MAX_ATTEMPTS })
    return thunkAPI.rejectWithValue(`Failed to issue credential after ${DEEP_CRED_MAX_ATTEMPTS} attempts`)
  },
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
