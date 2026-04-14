import type { Wallet } from '../content/types'

import { Get, JsonController } from 'routing-controllers'
import { Service } from 'typedi'

import { Wallets } from '../content/misc/Wallets'
import logger from '../utils/logger'

@JsonController('/wallets')
@Service()
export class WalletController {
  private wallets: Wallet[]

  public constructor() {
    this.wallets = Wallets
  }

  @Get('/')
  public async getAll() {
    logger.debug({ count: this.wallets.length }, 'Fetching all wallets')
    return this.wallets
  }
}
