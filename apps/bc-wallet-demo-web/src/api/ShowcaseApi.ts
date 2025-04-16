import type { AxiosResponse } from 'axios'

import type { ShowcaseResponse } from 'bc-wallet-openapi'
import { showcaseApi } from './BaseUrl'

export const getShowcaseBySlug = async (slug: string): Promise<AxiosResponse<ShowcaseResponse>> => {
  return showcaseApi.get(`/showcases/${slug}`)
}
