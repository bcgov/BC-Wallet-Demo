import { customType } from 'drizzle-orm/pg-core'
import { Buffer } from 'buffer'

export const customBytea = customType<{
  data: Buffer
  default: false
}>({
  dataType() {
    return 'bytea'
  },
  fromDriver(value) {
    if (value instanceof Uint8Array) {
      return Buffer.from(value)
    }
    if (typeof value === 'string') {
      return Buffer.from(value.replace(/^\\x/, ''), 'hex')
    }
    throw new Error('Invalid value for bytea column')
  },
})
