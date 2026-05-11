import type { ProofRequestData } from '../slices/types'
import type { AxiosResponse } from 'axios'

import { apiCall } from './BaseUrl'

export const createProofRequest = (data: ProofRequestData): Promise<AxiosResponse> => {
  return apiCall.post(`/demo/proofs/requestProof`, {
    connection_id: data.connectionId,
    presentation_request: {
      indy: {
        requested_attributes: Object.assign({}, data.attributes),
        requested_predicates: Object.assign({}, data.predicates),
        version: '1.0.0',
        name: data.requestOptions?.name,
      },
    },
    auto_remove_on_failure: true,
    auto_verify: true,
    comment: data.requestOptions?.comment,
  })
}

export const createDeepProofRequest = (data: ProofRequestData): Promise<AxiosResponse> => {
  return apiCall.post(`/demo/deeplink/requestProof`, {
    connection_id: data.connectionId,
    presentation_request: {
      indy: {
        requested_attributes: Object.assign({}, data.attributes),
        requested_predicates: Object.assign({}, data.predicates),
        version: '1.0.0',
        name: data.requestOptions?.name,
      },
    },
    auto_remove_on_failure: true,
    auto_verify: true,
    comment: data.requestOptions?.comment ?? '',
  })
}

export const createOOBProofRequest = (data: ProofRequestData): Promise<AxiosResponse> => {
  return apiCall.post(`/demo/proofs/requestProofOOB`, {
    presentation_request: {
      indy: {
        requested_attributes: Object.assign({}, data.attributes),
        requested_predicates: Object.assign({}, data.predicates),
        version: '1.0.0',
        name: data.requestOptions?.name,
      },
    },
    auto_remove_on_failure: true,
    auto_verify: true,
    comment: data.requestOptions?.comment,
  })
}

export const getProofById = (proofId: string): Promise<AxiosResponse> => {
  return apiCall.get(`/demo/proofs/${proofId}`)
}

export const deleteProofById = (proofId: string): Promise<AxiosResponse> => {
  return apiCall.delete(`/demo/proofs/${proofId}`)
}
