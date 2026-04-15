import type { ProofRequestData } from '../types'

import { createAsyncThunk } from '@reduxjs/toolkit'

import * as Api from '../../api/ProofApi'
import log from '../../utils/logger'

export const createProof = createAsyncThunk('proof/createProof', async (data: ProofRequestData) => {
  log.debug('[proof] requesting proof from connection', { connectionId: data.connectionId })
  const response = await Api.createProofRequest(data)
  log.info('[proof] proof request sent', {
    presentationExchangeId: response.data?.presentation_exchange_id,
    state: response.data?.state,
  })
  return response.data
})

export const createDeepProof = createAsyncThunk('proof/createDeepProof', async (data: ProofRequestData, thunkAPI) => {
  log.debug('[proof] requesting deep-link proof, polling until connection ready', { connectionId: data.connectionId })
  const MAX_ATTEMPTS = 10
  const BASE_DELAY_MS = 500
  const sleep = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, ms)
      thunkAPI.signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (thunkAPI.signal.aborted) {
      return thunkAPI.rejectWithValue('Cancelled')
    }
    try {
      const response = await Api.createDeepProofRequest(data)
      log.info('[proof] deep-link proof request sent', {
        attempt,
        presentationExchangeId: response.data?.presentation_exchange_id,
      })
      return response.data
    } catch {
      log.debug('[proof] deep-link proof attempt failed', { attempt, maxAttempts: MAX_ATTEMPTS })
      if (attempt < MAX_ATTEMPTS) {
        await sleep(BASE_DELAY_MS * 2 ** (attempt - 1))
      }
    }
  }
  log.error('[proof] deep-link proof failed after max attempts', { maxAttempts: MAX_ATTEMPTS })
  return thunkAPI.rejectWithValue(`Failed to create deep proof after ${MAX_ATTEMPTS} attempts`)
})

export const createProofOOB = createAsyncThunk('proof/createProofOOB', async (data: ProofRequestData) => {
  log.debug('[proof] creating out-of-band proof request')
  const response = await Api.createOOBProofRequest(data)
  log.info('[proof] OOB proof request created', {
    presentationExchangeId: response.data?.proof?.presentation_exchange_id,
  })
  return response.data
})

export const fetchProofById = createAsyncThunk('proof/fetchById', async (id: string) => {
  log.debug('[proof] fetching proof by id', id)
  const response = await Api.getProofById(id)
  log.debug('[proof] proof state', { id, state: response.data?.state })
  return response.data
})

export const deleteProofById = createAsyncThunk('proof/deleteById', async (id: string) => {
  log.debug('[proof] deleting proof', id)
  await Api.deleteProofById(id)
  return id
})
