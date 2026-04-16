import type { AxiosResponse } from 'axios'

import { apiCall } from './BaseUrl'

export const createInvitation = (
  agentName?: string,
  goalCode?: string,
  agentImageUrl?: string
): Promise<AxiosResponse> => {
  return apiCall.post('/demo/connections/createInvite', {
    my_label: agentName,
    image_url: agentImageUrl,
    goal_code: goalCode,
  })
}

export const getConnectionByInvitation = (invitationMsgId: string): Promise<AxiosResponse> => {
  return apiCall.get(`/demo/connections/invitationId/${invitationMsgId}`)
}

export const getConnectionById = (connectionId: string): Promise<AxiosResponse> => {
  return apiCall.get(`/demo/connections/getConnectionStatus/${connectionId}`)
}
