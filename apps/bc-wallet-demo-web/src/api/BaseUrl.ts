import axios from 'axios'
import { setupCache } from 'axios-cache-interceptor'
import type { CacheOptions } from 'axios-cache-interceptor/src/cache/create'

const cacheOptions: CacheOptions = {
  ttl: 30 * 24 * 60 * 60 * 1000, // keep 30 days
  methods: ['get'],
  cachePredicate: (response) => {
    return response.status >= 200 && response.status < 400
  },
}

export const demoBackendBaseRoute = process.env.REACT_APP_BASE_ROUTE ?? '/digital-trust/showcase'
export const demoBackendBaseWsUrl = process.env.REACT_APP_HOST_BACKEND ?? 'http://127.0.0.1:5000'
export const demoBackendBaseUrl = demoBackendBaseWsUrl + demoBackendBaseRoute
export const demoBackendSocketPath = `${demoBackendBaseRoute}/socket/`
export const demoBackendApi = setupCache(
  axios.create({
    baseURL: demoBackendBaseUrl,
  }),
  cacheOptions
)

export const showcaseServerBaseUrl = process.env.REACT_APP_SHOWCASE_BACKEND ?? 'http://127.0.0.1:5005'
export const showcaseApi = setupCache(
  axios.create({
    baseURL: showcaseServerBaseUrl,
  }),
  cacheOptions
)
