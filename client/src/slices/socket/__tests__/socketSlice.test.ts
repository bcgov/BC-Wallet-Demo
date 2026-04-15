import { describe, it, expect, vi } from 'vitest'

vi.mock('../../../utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import socketReducer, { setMessage } from '../socketSlice'

describe('socketSlice', () => {
  it('has empty initial state', () => {
    const state = socketReducer(undefined, { type: '@@init' })
    expect(state).toEqual({})
  })

  it('setMessage stores the payload on state', () => {
    const msg = { endpoint: 'connections', connection_id: 'conn-1', state: 'active' }
    const state = socketReducer(undefined, setMessage(msg))
    expect(state.message).toEqual(msg)
  })

  it('setMessage overwrites a previous message', () => {
    const first = { endpoint: 'connections', connection_id: 'conn-1', state: 'invited' }
    const second = { endpoint: 'connections', connection_id: 'conn-1', state: 'active' }
    let state = socketReducer(undefined, setMessage(first))
    state = socketReducer(state, setMessage(second))
    expect(state.message).toEqual(second)
  })
})
