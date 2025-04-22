import axios from 'axios'
import { setupCache } from 'axios-cache-interceptor'
import type { CacheOptions } from 'axios-cache-interceptor/src/cache/create'

declare global {
  interface Window {
    __env?: {
      REACT_APP_HOST_BACKEND?: string;
      REACT_APP_BASE_ROUTE?: string;
      REACT_APP_SHOWCASE_BACKEND?: string;
    };
  }
}

const getEnv = (key: string, fallback: string): string => {
  if (window.__env && window.__env[key as keyof typeof window.__env]) {
    return window.__env[key as keyof typeof window.__env] || fallback;
  }
  return process.env[key] || fallback;
};

console.log('Environment Variables:');
console.log('REACT_APP_HOST_BACKEND:', getEnv('REACT_APP_HOST_BACKEND', ''));
console.log('REACT_APP_BASE_ROUTE:', getEnv('REACT_APP_BASE_ROUTE', '/digital-trust/showcase'));
console.log('REACT_APP_SHOWCASE_BACKEND:', getEnv('REACT_APP_SHOWCASE_BACKEND', ''));
console.log('window.__env:', window.__env);

const cacheOptions: CacheOptions = {
  ttl: 30 * 24 * 60 * 60 * 1000, // keep 30 days
  methods: ['get'],
  cachePredicate: (response) => {
    return response.status >= 200 && response.status < 400
  },
}

export const demoBackendBaseRoute = getEnv('REACT_APP_BASE_ROUTE', '/digital-trust/showcase');
export const demoBackendBaseWsUrl = getEnv('REACT_APP_HOST_BACKEND', '');
export const demoBackendBaseUrl = demoBackendBaseWsUrl + demoBackendBaseRoute;
export const demoBackendSocketPath = `${demoBackendBaseRoute}/socket/`;
export const demoBackendApi = setupCache(
  axios.create({
    baseURL: demoBackendBaseUrl,
  }),
  cacheOptions
);

export const showcaseServerBaseUrl = getEnv('REACT_APP_SHOWCASE_BACKEND', '');
export const showcaseApi = setupCache(
  axios.create({
    baseURL: showcaseServerBaseUrl,
  }),
  cacheOptions
);
