import type { AxiosResponse } from 'axios'

import { apiCall } from './BaseUrl'

export const getScenariosByCharType = (type: string): Promise<AxiosResponse> => {
  return apiCall.get(`/demo/scenarios/character/${type}`, {})
}

export const getScenarioBySlug = (slug: string): Promise<AxiosResponse> => {
  return apiCall.get(`/demo/scenarios/${slug}`)
}
