import axios from 'axios'

export const baseUrl = (process.env.REACT_APP_HOST_BACKEND ?? '') + process.env.REACT_APP_BASE_ROUTE
export const baseWsUrl = process.env.REACT_APP_HOST_BACKEND ?? ''
export const baseRoute = process.env.REACT_APP_BASE_ROUTE
export const socketPath = `${baseRoute}/demo/socket/`

export const apiCall = axios.create({ baseURL: baseUrl })
