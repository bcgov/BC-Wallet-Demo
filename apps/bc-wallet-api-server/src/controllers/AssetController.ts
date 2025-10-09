import {
  AssetResponse,
  AssetResponseFromJSONTyped,
  AssetRequest,
  AssetsResponse,
  AssetsResponseFromJSONTyped,
  instanceOfAssetRequest,
} from 'bc-wallet-openapi'
import { Response } from 'express'
import {
  Authorized,
  BadRequestError,
  Body,
  Delete,
  Get,
  HttpCode,
  JsonController,
  OnUndefined,
  Param,
  Post,
  Put,
  Res,
} from 'routing-controllers'
import { Service } from 'typedi'

import AssetService from '../services/AssetService'
import { getBasePath } from '../utils/auth'
import { createRequestLogger } from '../utils/logger'
import { assetDTOFrom, newAssetFrom } from '../utils/mappers'

@JsonController(getBasePath('/assets'))
@Service()
class AssetController {
  private readonly logger = createRequestLogger('AssetController')

  public constructor(private assetService: AssetService) {}

  @Get('/')
  public async getAll(): Promise<AssetsResponse> {
    this.logger.info('Getting all assets')
    try {
      const result = await this.assetService.getAssets()
      const assets = result.map((asset) => assetDTOFrom(asset))
      this.logger.info({ count: assets.length }, 'Successfully retrieved assets')
      return AssetsResponseFromJSONTyped({ assets }, false)
    } catch (e) {
      this.logger.error({ error: e }, 'Failed to get all assets')
      return Promise.reject(e)
    }
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<AssetResponse> {
    this.logger.info({ id }, 'Getting asset by id')
    try {
      const result = await this.assetService.getAsset(id)
      this.logger.info({ id }, 'Successfully retrieved asset')
      return AssetResponseFromJSONTyped({ asset: assetDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to get asset')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/')
  public async post(@Body({ options: { limit: '250mb' } }) assetRequest: AssetRequest): Promise<AssetResponse> {
    this.logger.info({ assetName: assetRequest.name }, 'Creating new asset')
    try {
      if (!instanceOfAssetRequest(assetRequest)) {
        this.logger.warn('Invalid asset request format')
        return Promise.reject(new BadRequestError())
      }
      const result = await this.assetService.createAsset(newAssetFrom(assetRequest))
      this.logger.info({ assetId: result.id }, 'Successfully created asset')
      return AssetResponseFromJSONTyped({ asset: assetDTOFrom(result) }, false)
    } catch (e) {
      this.logger.error({ error: e }, 'Failed to create asset')
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:id')
  public async put(
    @Param('id') id: string,
    @Body({ options: { limit: '250mb' } }) assetRequest: AssetRequest,
  ): Promise<AssetResponse> {
    this.logger.info({ id, assetName: assetRequest.name }, 'Updating asset')
    try {
      if (!instanceOfAssetRequest(assetRequest)) {
        this.logger.warn({ id }, 'Invalid asset request format for update')
        return Promise.reject(new BadRequestError())
      }
      const result = await this.assetService.updateAsset(id, newAssetFrom(assetRequest))
      this.logger.info({ id }, 'Successfully updated asset')
      return AssetResponseFromJSONTyped({ asset: assetDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to update asset')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    this.logger.info({ id }, 'Deleting asset')
    try {
      await this.assetService.deleteAsset(id)
      this.logger.info({ id }, 'Successfully deleted asset')
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to delete asset')
      }
      return Promise.reject(e)
    }
  }

  @Get('/:id/file')
  public async getAssetAsFile(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    this.logger.info({ id }, 'Getting asset as file')
    try {
      const result = await this.assetService.getAsset(id)
      res.setHeader('Content-Type', result.mediaType)
      this.logger.info({ id, mediaType: result.mediaType }, 'Successfully retrieved asset file')
      return res.send(Buffer.from(result.content.toString(), 'base64'))
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to get asset file')
      }
      return Promise.reject(e)
    }
  }
}
export default AssetController
