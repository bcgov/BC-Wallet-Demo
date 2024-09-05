import type { AxiosRequestConfig } from 'axios'

import axios from 'axios'
import moment from 'moment'

export let agentKey = ''

export const tractionBaseUrl = process.env.TRACTION_URL ?? ''

export const tractionApiKeyUpdaterInit = async () => {
  // get traction api key
  const tractionBaseUrl = process.env.TRACTION_URL ?? ''
  const tenantId = process.env.TENANT_ID ?? ''
  const apiKey = process.env.API_KEY ?? ''
  agentKey =
    (await axios.post(`${tractionBaseUrl}/multitenancy/wallet/${tenantId}/token`, { api_key: apiKey })).data
      ?.token ?? agentKey
  // refresh agent key every hour
  setInterval(async () => {
    agentKey =
      (await axios.post(`${tractionBaseUrl}/multitenancy/wallet/${tenantId}/token`, { api_key: apiKey })).data
        ?.token ?? agentKey
  }, 3600000)
}

export const tractionRequest = {
  get: (url: string, config?: AxiosRequestConfig<any>) => {
    return axios.get(`${process.env.TRACTION_URL}${url}`, {
      ...config,
      timeout: 80000,
      headers: { ...config?.headers, Authorization: `Bearer ${agentKey}` },
    })
  },
  delete: (url: string, config?: AxiosRequestConfig<any>) => {
    return axios.delete(`${process.env.TRACTION_URL}${url}`, {
      ...config,
      timeout: 80000,
      headers: { ...config?.headers, Authorization: `Bearer ${agentKey}` },
    })
  },
  post: (url: string, data: any, config?: AxiosRequestConfig<any>) => {
    return axios.post(`${process.env.TRACTION_URL}${url}`, data, {
      ...config,
      timeout: 80000,
      headers: { ...config?.headers, Authorization: `Bearer ${agentKey}` },
    })
  },
}

export const tractionGarbageCollection = async () => {
  // delete all connections that are older than one day
  const cleanupConnections = async () => {
    const connections: any[] = (await tractionRequest.get('/connections')).data.results
    connections.forEach((conn) => {
      if (
        moment().diff(moment(conn.created_at), 'hours') >= 12 &&
        conn.alias !== 'endorser' &&
        conn.alias !== 'bcovrin-test-endorser'
      ) {
        tractionRequest.delete(`/connections/${conn.connection_id}`)
      }
    })
  }
  const cleanupExchangeRecords = async () => {
    const records: any[] = (await tractionRequest.get('/issue-credential/records')).data.results
    records.forEach((record) => {
      if (moment().diff(moment(record.created_at), 'hours') >= 12) {
        tractionRequest.delete(`/issue-credential/records/${record.credential_exchange_id}`)
      }
    })
  }
  const cleanupProofRecords = async () => {
    const proofs: any[] = (await tractionRequest.get('/present-proof/records')).data.results
    proofs.forEach((proof) => {
      if (moment().diff(moment(proof.created_at), 'hours') >= 12) {
        tractionRequest.delete(`/present-proof/records/${proof.presentation_exchange_id}`)
      }
    })
  }
  cleanupConnections()
  cleanupExchangeRecords()
  cleanupProofRecords()
  setInterval(async () => {
    cleanupConnections()
    cleanupExchangeRecords()
    cleanupProofRecords()
  }, 6 * 60 * 60 * 1000)
}
