import { createSlice } from '@reduxjs/toolkit'

interface SocketState {
  message?: any
}

const initialState: SocketState = {}

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setMessage: (state, action) => {
      state.message = action.payload
    },
  },
})

export const { setMessage } = socketSlice.actions

export default socketSlice.reducer
