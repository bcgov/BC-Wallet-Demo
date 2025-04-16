export enum Topic {
  SHOWCASE_CMD = 'SHOWCASE_CMD',
  SHOWCASE_CMD_TESTING = 'SHOWCASE_CMD_TESTING',
}

export type Action = 'publish-issuer-assets'

export type SendOptions = {
  authHeader?: string
  walletId?: string
  showcaseApiUrlBase?: string
  tractionApiUrlBase?: string
  tractionTenantId?: string
}
