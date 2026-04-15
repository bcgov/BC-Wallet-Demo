import log from 'loglevel'

// Default to 'info' in production, 'debug' otherwise.
// Override at runtime via localStorage: localStorage.setItem('loglevel', 'debug') then reload.
const defaultLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'
log.setDefaultLevel(defaultLevel)

const stored = localStorage.getItem('loglevel')
if (stored) {
  log.setLevel(stored as log.LogLevelDesc, false)
}

export default log
