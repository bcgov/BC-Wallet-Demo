import type { AxiosRequestConfig, AxiosError } from 'axios'

import axios from 'axios'

import logger from './logger'

const safeAxiosError = (err: unknown) => {
  const e = err as AxiosError
  return {
    message: e.message,
    status: e.response?.status,
    url: e.config?.url,
  }
}

const olderThanHours = (dateStr: string, hours: number) =>
  (Date.now() - new Date(dateStr).getTime()) / 3_600_000 >= hours

export let agentKey = ''

export const tractionBaseUrl = process.env.TRACTION_URL ?? ''

export const tractionApiKeyUpdaterInit = async () => {
  const tractionBaseUrl = process.env.TRACTION_URL ?? ''
  const tenantId = process.env.TENANT_ID ?? ''
  const apiKey = process.env.API_KEY ?? ''
  logger.info({ tractionBaseUrl, tenantId }, 'Initializing Traction API key')
  try {
    agentKey =
      (await axios.post(`${tractionBaseUrl}/multitenancy/tenant/${tenantId}/token`, { api_key: apiKey })).data?.token ??
      agentKey
    logger.info('Traction API key initialized successfully')
  } catch (err) {
    logger.warn(safeAxiosError(err), 'Failed to initialize Traction API key; server will start without a valid token')
  }
  // refresh agent key every hour
  setInterval(async () => {
    logger.debug('Refreshing Traction API key')
    try {
      agentKey =
        (await axios.post(`${tractionBaseUrl}/multitenancy/tenant/${tenantId}/token`, { api_key: apiKey })).data
          ?.token ?? agentKey
      logger.debug('Traction API key refreshed')
    } catch (err) {
      logger.warn(safeAxiosError(err), 'Failed to refresh Traction API key; retaining previous token')
    }
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
    try {
      const connections: any[] = (await tractionRequest.get('/connections')).data.results
      const stale = connections.filter(
        (conn) =>
          olderThanHours(conn.created_at, 12) && conn.alias !== 'endorser' && conn.alias !== 'bcovrin-test-endorser'
      )
      logger.info({ count: stale.length }, 'Garbage collection: deleting stale connections')
      await Promise.all(stale.map((conn) => tractionRequest.delete(`/connections/${conn.connection_id}`)))
    } catch (err) {
      logger.warn(safeAxiosError(err), 'Garbage collection: failed to clean up connections')
    }
  }
  const cleanupExchangeRecords = async () => {
    try {
      const records: any[] = (await tractionRequest.get('/issue-credential/records')).data.results
      const stale = records.filter((record) => olderThanHours(record.created_at, 12))
      logger.info({ count: stale.length }, 'Garbage collection: deleting stale credential exchange records')
      await Promise.all(
        stale.map((record) => tractionRequest.delete(`/issue-credential/records/${record.credential_exchange_id}`))
      )
    } catch (err) {
      logger.warn(safeAxiosError(err), 'Garbage collection: failed to clean up credential exchange records')
    }
  }
  const cleanupProofRecords = async () => {
    try {
      const proofs: any[] = (await tractionRequest.get('/present-proof/records')).data.results
      const stale = proofs.filter((proof) => olderThanHours(proof.created_at, 12))
      logger.info({ count: stale.length }, 'Garbage collection: deleting stale proof records')
      await Promise.all(
        stale.map((proof) => tractionRequest.delete(`/present-proof/records/${proof.presentation_exchange_id}`))
      )
    } catch (err) {
      logger.warn(safeAxiosError(err), 'Garbage collection: failed to clean up proof records')
    }
  }
  cleanupConnections()
  cleanupExchangeRecords()
  cleanupProofRecords()
  setInterval(async () => {
    logger.debug('Running scheduled garbage collection')
    cleanupConnections()
    cleanupExchangeRecords()
    cleanupProofRecords()
  }, 6 * 60 * 60 * 1000)
}
