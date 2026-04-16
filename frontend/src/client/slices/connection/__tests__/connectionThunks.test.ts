import { configureStore } from '@reduxjs/toolkit'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../../api/ConnectionApi', () => ({
  createInvitation: vi.fn(),
  getConnectionByInvitation: vi.fn(),
}))

import * as ConnectionApi from '../../../api/ConnectionApi'
import connectionReducer from '../connectionSlice'
import { createInvitation } from '../connectionThunks'

const makeStore = () => configureStore({ reducer: { connection: connectionReducer } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createInvitation thunk', () => {
  it('populates state on success', async () => {
    vi.mocked(ConnectionApi.createInvitation).mockResolvedValue({
      data: { invi_msg_id: 'msg-1', invitation_url: 'http://invite' },
    } as any)
    vi.mocked(ConnectionApi.getConnectionByInvitation).mockResolvedValue({
      data: { connection_id: 'conn-42', state: 'response' },
    } as any)

    const store = makeStore()
    await store.dispatch(createInvitation({ issuer: 'bcgov' }) as any)

    const conn = store.getState().connection
    expect(conn.isLoading).toBe(false)
    expect(conn.id).toBe('conn-42')
    expect(conn.state).toBe('invited')
    expect(conn.invitationUrl).toBe('http://invite')
  })

  it('sets isLoading=true while pending, false after rejection', async () => {
    vi.mocked(ConnectionApi.createInvitation).mockRejectedValue(new Error('network'))

    const store = makeStore()
    const dispatchResult = store.dispatch(createInvitation({}) as any)
    // isLoading should be true while the thunk is running
    expect(store.getState().connection.isLoading).toBe(true)
    await dispatchResult
    // After rejection the thunk should clear the loading state
    expect(store.getState().connection.isLoading).toBe(false)
  })

  it('calls createInvitation API with correct arguments', async () => {
    vi.mocked(ConnectionApi.createInvitation).mockResolvedValue({
      data: { invi_msg_id: 'msg-2', invitation_url: 'http://url2' },
    } as any)
    vi.mocked(ConnectionApi.getConnectionByInvitation).mockResolvedValue({
      data: { connection_id: 'conn-2', state: 'response' },
    } as any)

    const store = makeStore()
    await store.dispatch(createInvitation({ issuer: 'test-issuer', goalCode: 'gc-1' }) as any)

    expect(ConnectionApi.createInvitation).toHaveBeenCalledWith('test-issuer', 'gc-1')
    expect(ConnectionApi.getConnectionByInvitation).toHaveBeenCalledWith('msg-2')
  })
})
