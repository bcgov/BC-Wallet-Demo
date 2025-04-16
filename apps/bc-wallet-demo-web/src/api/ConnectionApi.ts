import type { AxiosResponse } from 'axios'

import { demoBackendApi } from './BaseUrl'

export const createInvitation = (
  agentName?: string,
  goalCode?: string,
  goal?: string,
  agentImageUrl?: string
): Promise<AxiosResponse> => {
  return demoBackendApi.post('/demo/connections/createInvite', {
    my_label: agentName,
    image_url: agentImageUrl,
    goal_code: goalCode,
    goal
  })
}

export const getConnectionByInvitation = (invitationMsgId: string): Promise<AxiosResponse> => {
  return demoBackendApi.get(`/demo/connections/invitationId/${invitationMsgId}`)
}

export const getConnectionById = (connectionId: string): Promise<AxiosResponse> => {
  return demoBackendApi.get(`/demo/connections/getConnectionStatus/${connectionId}`)
}
