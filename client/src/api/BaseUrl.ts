import axios from 'axios'

export const baseRoute = process.env.REACT_APP_BASE_ROUTE ?? '/digital-trust/showcase'
export const baseUrl = (process.env.REACT_APP_HOST_BACKEND ?? '') + baseRoute
export const baseWsUrl = process.env.REACT_APP_HOST_BACKEND ?? ''
export const socketPath = `${baseRoute}/demo/socket/`

export const apiCall = axios.create({ baseURL: baseUrl })
