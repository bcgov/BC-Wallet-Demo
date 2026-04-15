import { configureStore } from '@reduxjs/toolkit'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../../api/CredentialApi', () => ({
  issueCredential: vi.fn(),
  issueDeepCredential: vi.fn(),
  getCredentialById: vi.fn(),
  deleteCredentialById: vi.fn(),
}))

import * as CredentialApi from '../../../api/CredentialApi'
import credentialsReducer, { setCredential } from '../credentialsSlice'
import { issueCredential, issueDeepCredential, fetchCredentialById, deleteCredentialById } from '../credentialsThunks'

const makeStore = () => configureStore({ reducer: { credentials: credentialsReducer } })

const mockCred = {
  name: 'Person Credential',
  icon: '/icon.png',
  version: '1.0',
  attributes: [],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('issueCredential thunk', () => {
  it('sets isIssueCredentialLoading=false on fulfilled', async () => {
    vi.mocked(CredentialApi.issueCredential).mockResolvedValue({
      data: { credential_exchange_id: 'cred-1' },
    } as any)

    const store = makeStore()
    await store.dispatch(issueCredential({ connectionId: 'conn-1', cred: mockCred, credDefId: 'def-1' }) as any)
    expect(store.getState().credentials.isIssueCredentialLoading).toBe(false)
  })

  it('sets isIssueCredentialLoading=true while pending', async () => {
    vi.mocked(CredentialApi.issueCredential).mockResolvedValue({
      data: { credential_exchange_id: 'cred-1' },
    } as any)

    const store = makeStore()
    const promise = store.dispatch(
      issueCredential({ connectionId: 'conn-1', cred: mockCred, credDefId: 'def-1' }) as any
    )
    expect(store.getState().credentials.isIssueCredentialLoading).toBe(true)
    await promise
  })

  it('records error and clears loading on rejected', async () => {
    vi.mocked(CredentialApi.issueCredential).mockRejectedValue(new Error('issue failed'))

    const store = makeStore()
    await store.dispatch(issueCredential({ connectionId: 'conn-1', cred: mockCred, credDefId: 'def-1' }) as any)
    const creds = store.getState().credentials
    expect(creds.isIssueCredentialLoading).toBe(false)
    expect(creds.error).toBeDefined()
    expect(creds.error?.message).toBe('issue failed')
  })
})

describe('issueDeepCredential thunk — retry loop', () => {
  it('retries until success and returns response data', async () => {
    vi.mocked(CredentialApi.issueDeepCredential)
      .mockRejectedValueOnce(new Error('not ready'))
      .mockRejectedValueOnce(new Error('not ready'))
      .mockResolvedValue({ data: { credential_exchange_id: 'deep-cred-1' } } as any)

    const store = makeStore()
    const result = await store.dispatch(
      issueDeepCredential({ connectionId: 'conn-1', cred: mockCred, credDefId: 'def-1' }) as any
    )

    expect(result.payload).toEqual({ credential_exchange_id: 'deep-cred-1' })
    expect(CredentialApi.issueDeepCredential).toHaveBeenCalledTimes(3)
  })
})

describe('fetchCredentialById thunk', () => {
  it('returns credential data on success', async () => {
    vi.mocked(CredentialApi.getCredentialById).mockResolvedValue({
      data: { credential_exchange_id: 'cred-fetch-1', state: 'credential_issued' },
    } as any)

    const store = makeStore()
    const result = await store.dispatch(fetchCredentialById('cred-fetch-1') as any)
    expect(result.payload).toMatchObject({ credential_exchange_id: 'cred-fetch-1' })
  })
})

describe('deleteCredentialById thunk', () => {
  it('returns the id on success', async () => {
    vi.mocked(CredentialApi.deleteCredentialById).mockResolvedValue(undefined as any)

    const store = makeStore()
    const result = await store.dispatch(deleteCredentialById('cred-del-1') as any)
    expect(result.payload).toBe('cred-del-1')
  })
})

describe('credentialsSlice reducers', () => {
  it('setCredential adds a new credName if not already present', () => {
    const store = makeStore()
    store.dispatch(
      setCredential({
        credential_definition_id: 'ISSUER123:3:CL:100:CredentialName',
        revoc_reg_id: 'rev-reg-1',
        connection_id: 'conn-1',
        revocation_id: 'rev-1',
      })
    )
    expect(store.getState().credentials.issuedCredentials).toContain('CredentialName')
  })

  it('setCredential does not add a duplicate credName', () => {
    const store = makeStore()
    const payload = {
      credential_definition_id: 'ISSUER123:3:CL:100:MyCredential',
      revoc_reg_id: 'rev-reg-2',
      connection_id: 'conn-2',
      revocation_id: 'rev-2',
    }
    store.dispatch(setCredential(payload))
    store.dispatch(setCredential(payload))
    const names = store.getState().credentials.issuedCredentials.filter((n) => n === 'MyCredential')
    expect(names).toHaveLength(1)
  })

  it('clearUseCase resets isLoading to false', () => {
    const store = makeStore()
    store.dispatch({ type: 'clearUseCase' })
    expect(store.getState().credentials.isLoading).toBe(false)
  })
})
