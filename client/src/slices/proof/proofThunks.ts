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

export const createDeepProof = createAsyncThunk('proof/createProof', async (data: ProofRequestData) => {
  log.debug('[proof] requesting deep-link proof, polling until connection ready', { connectionId: data.connectionId })
  let success = false
  let response = undefined
  let attempt = 0
  while (!success) {
    try {
      attempt++
      response = await Api.createDeepProofRequest(data)
      success = true
      log.info('[proof] deep-link proof request sent', {
        attempt,
        presentationExchangeId: response.data?.presentation_exchange_id,
      })
    } catch {
      log.debug('[proof] deep-link proof attempt failed, retrying', { attempt })
    }
  }
  return response?.data
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
