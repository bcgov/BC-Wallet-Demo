import { createSlice } from '@reduxjs/toolkit'

import { createInvitation } from './connectionThunks'

export interface ConnectionState {
  id?: string
  state?: string
  invitationUrl?: string
  isLoading: boolean
  isDeepLink: boolean
}

const initialState: ConnectionState = {
  id: undefined,
  state: undefined,
  invitationUrl: undefined,
  isLoading: false,
  isDeepLink: false,
}

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setDeepLink: (state) => {
      state.isDeepLink = true
    },
    clearConnection: (state) => {
      state.id = undefined
      state.state = undefined
      state.invitationUrl = undefined
      state.isLoading = false
      state.isDeepLink = false
    },
    setConnection: (state, action) => {
      state.id = action.payload.connection_id
      state.state = action.payload.state
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createInvitation.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createInvitation.fulfilled, (state, action) => {
        state.isLoading = false
        state.id = action.payload.connection_id
        state.state = 'invited'
        state.invitationUrl = action.payload.invitation_url
      })
      .addCase('clearUseCase', (state) => {
        state.id = undefined
        state.state = undefined
        state.invitationUrl = undefined
        state.isLoading = false
      })
  },
})

export const { clearConnection, setDeepLink, setConnection } = connectionSlice.actions

export default connectionSlice.reducer
