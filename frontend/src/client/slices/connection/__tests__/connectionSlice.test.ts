import { configureStore } from '@reduxjs/toolkit'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../../utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import connectionReducer, { clearConnection, setDeepLink, setConnection } from '../connectionSlice'
import { createInvitation } from '../connectionThunks'

const makeStore = () => configureStore({ reducer: { connection: connectionReducer } })

describe('connectionSlice reducers', () => {
  it('has correct initial state', () => {
    const state = connectionReducer(undefined, { type: '@@init' })
    expect(state).toEqual({
      id: undefined,
      state: undefined,
      invitationUrl: undefined,
      isLoading: false,
      isDeepLink: false,
    })
  })

  it('setDeepLink sets isDeepLink to true', () => {
    const state = connectionReducer(undefined, setDeepLink())
    expect(state.isDeepLink).toBe(true)
  })

  it('setConnection updates id and state from payload', () => {
    const state = connectionReducer(undefined, setConnection({ connection_id: 'conn-123', state: 'active' }))
    expect(state.id).toBe('conn-123')
    expect(state.state).toBe('active')
  })

  it('clearConnection resets all fields', () => {
    const preloaded = {
      id: 'conn-abc',
      state: 'complete',
      invitationUrl: 'http://invite',
      isLoading: true,
      isDeepLink: true,
    }
    const state = connectionReducer(preloaded, clearConnection())
    expect(state).toEqual({
      id: undefined,
      state: undefined,
      invitationUrl: undefined,
      isLoading: false,
      isDeepLink: false,
    })
  })

  it('clearScenario action resets connection fields', () => {
    const preloaded = {
      id: 'conn-abc',
      state: 'complete',
      invitationUrl: 'http://invite',
      isLoading: false,
      isDeepLink: false,
    }
    const state = connectionReducer(preloaded, { type: 'clearScenario' })
    expect(state.id).toBeUndefined()
    expect(state.state).toBeUndefined()
    expect(state.invitationUrl).toBeUndefined()
  })
})

describe('connectionSlice extraReducers', () => {
  it('sets isLoading=true on createInvitation.pending', () => {
    const store = makeStore()
    store.dispatch({ type: createInvitation.pending.type })
    expect(store.getState().connection.isLoading).toBe(true)
  })

  it('populates connection on createInvitation.fulfilled', () => {
    const store = makeStore()
    store.dispatch({
      type: createInvitation.fulfilled.type,
      payload: {
        connection_id: 'conn-999',
        invitation_url: 'http://invite-url',
      },
    })
    const conn = store.getState().connection
    expect(conn.isLoading).toBe(false)
    expect(conn.id).toBe('conn-999')
    expect(conn.state).toBe('invited')
    expect(conn.invitationUrl).toBe('http://invite-url')
  })
})
