import type { AxiosResponse } from 'axios'

import type { CredentialDefinitionResponse } from 'bc-wallet-openapi'
import { showcaseApi } from './BaseUrl'

export const getCredentialDefinitionById = async (id: string): Promise<AxiosResponse<CredentialDefinitionResponse>> => {
    return showcaseApi.get(`/credentials/definitions/${id}`)
}
