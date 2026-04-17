import axios from 'axios'

import log from '../utils/logger'

export const baseRoute = import.meta.env.VITE_BASE_ROUTE || '/digital-trust/showcase'
export const baseUrl = (import.meta.env.VITE_HOST_BACKEND || '') + baseRoute
export const baseWsUrl = import.meta.env.VITE_HOST_BACKEND || ''
export const socketPath = `${baseRoute}/demo/socket/`

export const apiCall = axios.create({ baseURL: baseUrl })

apiCall.interceptors.request.use((config) => {
  log.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params ?? '')
  return config
})

apiCall.interceptors.response.use(
  (response) => {
    log.debug(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
    return response
  },
  (error) => {
    log.warn(
      `[API] error ${error.response?.status ?? 'unknown'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      error.message
    )
    return Promise.reject(error)
  }
)
