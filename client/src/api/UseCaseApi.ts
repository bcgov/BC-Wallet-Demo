import type { AxiosResponse } from 'axios'

import { apiCall } from './BaseUrl'

export const getUseCasesByCharType = (type: string): Promise<AxiosResponse> => {
  return apiCall.get(`/demo/usecases/character/${type}`, {})
}

export const getUseCaseBySlug = (slug: string): Promise<AxiosResponse> => {
  return apiCall.get(`/demo/usecases/${slug}`)
}
