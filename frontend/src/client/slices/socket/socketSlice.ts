import { createSlice } from '@reduxjs/toolkit'

import log from '../../utils/logger'

interface SocketState {
  message?: any
}

const initialState: SocketState = {}

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setMessage: (state, action) => {
      log.debug('[socket] message received', {
        endpoint: action.payload?.endpoint,
        connectionId: action.payload?.connection_id,
        state: action.payload?.state,
      })
      state.message = action.payload
    },
  },
})

export const { setMessage } = socketSlice.actions

export default socketSlice.reducer
