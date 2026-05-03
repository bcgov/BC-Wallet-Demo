import type { AxiosResponse } from 'axios'

import { apiCall } from './BaseUrl'

export const getShowcases = (): Promise<AxiosResponse> => {
  return apiCall.get('/demo/showcases')
}

export const getShowcaseById = (showcaseId: string): Promise<AxiosResponse> => {
  return apiCall.get(`/demo/showcases/${showcaseId}`)
}
