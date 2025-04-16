import type { AxiosResponse } from 'axios'

import { demoBackendApi } from './BaseUrl'

export const getLastServerReset = (): Promise<AxiosResponse> => {
  return demoBackendApi.get('/server/last-reset')
}
