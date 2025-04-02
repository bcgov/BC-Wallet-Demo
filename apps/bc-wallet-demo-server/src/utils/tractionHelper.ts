import type { AxiosRequestConfig } from 'axios'
import axios from 'axios'
import moment from 'moment'

export let agentKey = ''

export const tractionBaseUrl = process.env.TRACTION_URL ?? ''

export const tractionApiKeyUpdaterInit = async () => {
  // get traction api key
  const tractionBaseUrl = process.env.TRACTION_URL
  const tenantId = process.env.TENANT_ID
  const apiKey = process.env.API_KEY
  const walletKey = process.env.WALLET_KEY

  try {
    // Check if required environment variables are defined
    if (!tractionBaseUrl) {
      return Promise.reject(new Error("TRACTION_URL environment variable is not defined"))
    }
    if (!tenantId) {
      return Promise.reject(new Error("TENANT_ID environment variable is not defined"))
    }
    if (!apiKey && !walletKey) {
      return Promise.reject(new Error("Both API_KEY and WALLET_KEY environment variables are undefined"))
    }

    // Use apiKey if defined, otherwise use walletKey
    const payload = apiKey ? { api_key: apiKey } : { wallet_key: walletKey }

    agentKey =
      (await axios.post(`${tractionBaseUrl}/multitenancy/tenant/${tenantId}/token`, payload)).data?.token ??
      agentKey

    // refresh agent key every hour
    setInterval(async () => {
      try {
        agentKey =
          (await axios.post(`${tractionBaseUrl}/multitenancy/tenant/${tenantId}/token`, payload)).data?.token ??
          agentKey
      } catch (error) {
        console.error("Failed to refresh agent key:", error)
      }
    }, 3600000)
  } catch (error) {
    return Promise.reject(new Error(`Failed to initialize agent key: ${(error as Error).message}`))
  }}

export const tractionRequest = {
  get: (url: string, config?: AxiosRequestConfig) => {
    return axios.get(`${process.env.TRACTION_URL}${url}`, {
      ...config,
      timeout: 80000,
      headers: { ...config?.headers, Authorization: `Bearer ${agentKey}` },
    })
  },
  delete: (url: string, config?: AxiosRequestConfig) => {
    return axios.delete(`${process.env.TRACTION_URL}${url}`, {
      ...config,
      timeout: 80000,
      headers: { ...config?.headers, Authorization: `Bearer ${agentKey}` },
    })
  },
  post: (url: string, data: Record<string, unknown> | undefined, config?: AxiosRequestConfig) => {
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
