import type { AxiosResponse } from 'axios'

import { demoBackendApi } from './BaseUrl'

export const getWallets = (): Promise<AxiosResponse> => {
  return demoBackendApi.get('/demo/wallets')
}
