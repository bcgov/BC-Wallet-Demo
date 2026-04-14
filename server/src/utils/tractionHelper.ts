import type { AxiosRequestConfig } from 'axios'

import axios from 'axios'
import moment from 'moment'

import logger from './logger'

export let agentKey = ''

export const tractionBaseUrl = process.env.TRACTION_URL ?? ''

export const tractionApiKeyUpdaterInit = async () => {
  // get traction api key
  const tractionBaseUrl = process.env.TRACTION_URL ?? ''
  const tenantId = process.env.TENANT_ID ?? ''
  const apiKey = process.env.API_KEY ?? ''
  logger.info({ tractionBaseUrl, tenantId }, 'Initializing Traction API key')
  agentKey =
    (await axios.post(`${tractionBaseUrl}/multitenancy/tenant/${tenantId}/token`, { api_key: apiKey })).data?.token ??
    agentKey
  logger.info('Traction API key initialized successfully')
  // refresh agent key every hour
  setInterval(async () => {
    logger.debug('Refreshing Traction API key')
    agentKey =
      (await axios.post(`${tractionBaseUrl}/multitenancy/tenant/${tenantId}/token`, { api_key: apiKey })).data?.token ??
      agentKey
    logger.debug('Traction API key refreshed')
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
          moment().diff(moment(conn.created_at), 'hours') >= 12 &&
          conn.alias !== 'endorser' &&
          conn.alias !== 'bcovrin-test-endorser'
      )
      logger.info({ count: stale.length }, 'Garbage collection: deleting stale connections')
      stale.forEach((conn) => {
        tractionRequest.delete(`/connections/${conn.connection_id}`)
      })
    } catch (err) {
      logger.warn({ err }, 'Garbage collection: failed to clean up connections')
    }
  }
  const cleanupExchangeRecords = async () => {
    try {
      const records: any[] = (await tractionRequest.get('/issue-credential/records')).data.results
      const stale = records.filter((record) => moment().diff(moment(record.created_at), 'hours') >= 12)
      logger.info({ count: stale.length }, 'Garbage collection: deleting stale credential exchange records')
      stale.forEach((record) => {
        tractionRequest.delete(`/issue-credential/records/${record.credential_exchange_id}`)
      })
    } catch (err) {
      logger.warn({ err }, 'Garbage collection: failed to clean up credential exchange records')
    }
  }
  const cleanupProofRecords = async () => {
    try {
      const proofs: any[] = (await tractionRequest.get('/present-proof/records')).data.results
      const stale = proofs.filter((proof) => moment().diff(moment(proof.created_at), 'hours') >= 12)
      logger.info({ count: stale.length }, 'Garbage collection: deleting stale proof records')
      stale.forEach((proof) => {
        tractionRequest.delete(`/present-proof/records/${proof.presentation_exchange_id}`)
      })
    } catch (err) {
      logger.warn({ err }, 'Garbage collection: failed to clean up proof records')
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
