import type { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'

import axios from 'axios'

import log from '../utils/logger'

export const baseRoute = import.meta.env.VITE_BASE_ROUTE || '/digital-trust/showcase'
export const baseUrl = (import.meta.env.VITE_HOST_BACKEND || '') + baseRoute
export const baseWsUrl = import.meta.env.VITE_HOST_BACKEND || ''
export const socketPath = `${baseRoute}/demo/socket/`

// This warning is a false flag. This is the way we want to import this.
// eslint-disable-next-line import/no-named-as-default-member
export const apiCall = axios.create({ baseURL: baseUrl })

apiCall.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  log.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params ?? '')
  return config
})

apiCall.interceptors.response.use(
  (response: AxiosResponse) => {
    log.debug(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
    return response
  },
  (error: AxiosError) => {
    log.warn(
      `[API] error ${error.response?.status ?? 'unknown'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      error.message,
    )
    return Promise.reject(error)
  },
)
