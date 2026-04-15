import log from 'loglevel'

// Default to 'info' in production, 'debug' otherwise.
// Override at runtime via localStorage: localStorage.setItem('loglevel', 'debug')
const defaultLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

log.setDefaultLevel(defaultLevel)

export default log
