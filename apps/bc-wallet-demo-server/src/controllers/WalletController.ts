import { Get, JsonController } from 'routing-controllers'
import { Service } from 'typedi'

import { Wallets } from '../content/misc/Wallets'
import type { Wallet } from '../content/types'

@JsonController('/wallets')
@Service()
export class WalletController {
  private wallets: Wallet[]

  public constructor() {
    this.wallets = Wallets
  }

  @Get('/')
  public async getAll() {
    return this.wallets
  }
}
