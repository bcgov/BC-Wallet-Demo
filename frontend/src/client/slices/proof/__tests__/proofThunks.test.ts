import { configureStore } from '@reduxjs/toolkit'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../../api/ProofApi', () => ({
  createProofRequest: vi.fn(),
  createDeepProofRequest: vi.fn(),
  createOOBProofRequest: vi.fn(),
  getProofById: vi.fn(),
  deleteProofById: vi.fn(),
}))

import * as ProofApi from '../../../api/ProofApi'
import proofReducer from '../proofSlice'
import { createProof, createDeepProof, createProofOOB, fetchProofById, deleteProofById } from '../proofThunks'

const makeStore = () => configureStore({ reducer: { proof: proofReducer } })

const mockProofRequestData = {
  connectionId: 'conn-1',
  attributes: [],
  predicates: [],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createProof thunk', () => {
  it('sets isLoading=true while pending', async () => {
    vi.mocked(ProofApi.createProofRequest).mockResolvedValue({
      data: { presentation_exchange_id: 'pex-1', state: 'request_sent' },
    } as any)

    const store = makeStore()
    const promise = store.dispatch(createProof(mockProofRequestData) as any)
    expect(store.getState().proof.isLoading).toBe(true)
    await promise
  })

  it('stores proof with id on fulfilled', async () => {
    vi.mocked(ProofApi.createProofRequest).mockResolvedValue({
      data: { presentation_exchange_id: 'pex-42', state: 'request_sent' },
    } as any)

    const store = makeStore()
    await store.dispatch(createProof(mockProofRequestData) as any)

    const proof = store.getState().proof
    expect(proof.isLoading).toBe(false)
    expect(proof.proof).toMatchObject({ presentation_exchange_id: 'pex-42', id: 'pex-42' })
  })
})

describe('createDeepProof thunk — retry loop', () => {
  it('retries until success and returns response data', async () => {
    vi.mocked(ProofApi.createDeepProofRequest)
      .mockRejectedValueOnce(new Error('not ready'))
      .mockResolvedValue({
        data: { presentation_exchange_id: 'pex-deep-1', state: 'request_sent' },
      } as any)

    const store = makeStore()
    const result = await store.dispatch(createDeepProof(mockProofRequestData) as any)

    expect(result.payload).toMatchObject({ presentation_exchange_id: 'pex-deep-1' })
    expect(ProofApi.createDeepProofRequest).toHaveBeenCalledTimes(2)
  })
})

describe('createProofOOB thunk', () => {
  it('stores proofUrl and proof on fulfilled', async () => {
    const oobPayload = {
      proofUrl: 'http://oob-url',
      proof: { presentation_exchange_id: 'pex-oob-1', state: 'request_sent' },
    }
    vi.mocked(ProofApi.createOOBProofRequest).mockResolvedValue({
      data: oobPayload,
    } as any)

    const store = makeStore()
    await store.dispatch(createProofOOB(mockProofRequestData) as any)

    const proofState = store.getState().proof
    expect(proofState.proofUrl).toBe('http://oob-url')
    expect(proofState.proof).toMatchObject({ id: 'pex-oob-1' })
  })
})

describe('fetchProofById thunk', () => {
  it('updates proof state on fulfilled', async () => {
    vi.mocked(ProofApi.getProofById).mockResolvedValue({
      data: { presentation_exchange_id: 'pex-fetch-1', state: 'verified' },
    } as any)

    const store = makeStore()
    await store.dispatch(fetchProofById('pex-fetch-1') as any)

    const proofState = store.getState().proof
    expect(proofState.isLoading).toBe(false)
    expect(proofState.proof).toMatchObject({ id: 'pex-fetch-1', state: 'verified' })
  })
})

describe('deleteProofById thunk', () => {
  it('returns the id on success', async () => {
    vi.mocked(ProofApi.deleteProofById).mockResolvedValue(undefined as any)

    const store = makeStore()
    const result = await store.dispatch(deleteProofById('pex-del-1') as any)
    expect(result.payload).toBe('pex-del-1')
  })
})

describe('proofSlice reducers', () => {
  it('clearProof action resets proof to undefined', () => {
    const store = makeStore()
    store.dispatch({ type: 'proof/clearProof' })
    expect(store.getState().proof.proof).toBeUndefined()
    expect(store.getState().proof.isLoading).toBe(false)
  })

  it('clearUseCase action resets proof state', () => {
    const store = makeStore()
    store.dispatch({ type: 'clearUseCase' })
    expect(store.getState().proof.proof).toBeUndefined()
    expect(store.getState().proof.isLoading).toBe(false)
  })
})
