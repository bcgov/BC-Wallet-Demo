import { createAsyncThunk } from '@reduxjs/toolkit'

import * as Api from '../../api/ConnectionApi'

export const createInvitation = createAsyncThunk(
  'connection/createInvitation',
  async (params: { issuer?: string; goalCode?: string }) => {
    const invitation = await Api.createInvitation(params.issuer, params.goalCode)
    const connection = await Api.getConnectionByInvitation(invitation.data.invi_msg_id)
    return { ...connection.data, invitation_url: invitation.data.invitation_url }
  }
)
