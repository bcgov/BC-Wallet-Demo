import { createAsyncThunk } from '@reduxjs/toolkit'

import * as Api from '../../api/ConnectionApi'
import log from '../../utils/logger'

export const createInvitation = createAsyncThunk(
  'connection/createInvitation',
  async (params: { issuer?: string; goalCode?: string }) => {
    log.debug('[connection] creating invitation', params)
    const invitation = await Api.createInvitation(params.issuer, params.goalCode)
    log.debug('[connection] invitation created, fetching connection by invitation id', invitation.data.invi_msg_id)
    const connection = await Api.getConnectionByInvitation(invitation.data.invi_msg_id)
    log.info('[connection] connection established', {
      connectionId: connection.data.connection_id,
      state: connection.data.state,
    })
    return { ...connection.data, invitation_url: invitation.data.invitation_url }
  },
)
