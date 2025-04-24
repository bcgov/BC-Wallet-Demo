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
import { Response } from 'express'
import {
  AssetResponse,
  AssetResponseFromJSONTyped,
  AssetRequest,
  AssetsResponse,
  AssetsResponseFromJSONTyped,
  instanceOfAssetRequest,
} from 'bc-wallet-openapi'
import AssetService from '../services/AssetService'
import { assetDTOFrom, newAssetFrom } from '../utils/mappers'

@JsonController('/assets')
@Service()
class AssetController {
  public constructor(private assetService: AssetService) {}

  @Get('/')
  public async getAll(): Promise<AssetsResponse> {
    try {
      const result = await this.assetService.getAssets()
      const assets = result.map((asset) => assetDTOFrom(asset))
      return AssetsResponseFromJSONTyped({ assets }, false)
    } catch (e) {
      console.error(`getAll failed:`, e)
      return Promise.reject(e)
    }
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<AssetResponse> {
    try {
      const result = await this.assetService.getAsset(id)
      return AssetResponseFromJSONTyped({ asset: assetDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`getOne id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/')
  public async post(@Body({ options: { limit: '250mb' } }) assetRequest: AssetRequest): Promise<AssetResponse> {
    try {
      if (!instanceOfAssetRequest(assetRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.assetService.createAsset(newAssetFrom(assetRequest))
      return AssetResponseFromJSONTyped({ asset: assetDTOFrom(result) }, false)
    } catch (e) {
      console.error(`post failed:`, e)
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:id')
  public async put(@Param('id') id: string, @Body({ options: { limit: '250mb' } }) assetRequest: AssetRequest): Promise<AssetResponse> {
    try {
      if (!instanceOfAssetRequest(assetRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.assetService.updateAsset(id, newAssetFrom(assetRequest))
      return AssetResponseFromJSONTyped({ asset: assetDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`put id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    try {
      return await this.assetService.deleteAsset(id)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`delete id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:id/file')
  public async getAssetAsFile(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    try {
      const result = await this.assetService.getAsset(id)
      res.setHeader('Content-Type', result.mediaType)
      return res.send(Buffer.from(result.content.toString(), 'base64'))
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`getAssetAsFile id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }
}
export default AssetController
