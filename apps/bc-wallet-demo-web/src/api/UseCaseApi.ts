import type { AxiosResponse } from 'axios'

import { demoBackendApi } from './BaseUrl'

export const getUseCasesByCharType = (type: string): Promise<AxiosResponse> => {
  return demoBackendApi.get(`/demo/usecases/character/${type}`, {})
}

export const getUseCaseBySlug = (slug: string): Promise<AxiosResponse> => {
  return demoBackendApi.get(`/demo/usecases/${slug}`)
}
