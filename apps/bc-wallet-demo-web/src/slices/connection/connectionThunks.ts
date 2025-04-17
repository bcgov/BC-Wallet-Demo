import { createAsyncThunk } from '@reduxjs/toolkit'

import * as Api from '../../api/ConnectionApi'

export const createInvitation = createAsyncThunk(
  'connection/createInvitation',
  async (params: { entity?: string; goalCode?: string; goal?: string }) => {
    const invitation = await Api.createInvitation(params.entity, params.goalCode, params.goal)
    const connection = await Api.getConnectionByInvitation(invitation.data.invi_msg_id)
    return { ...connection.data, invitation_url: invitation.data.invitation_url }
  }
)
