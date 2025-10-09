import { Service } from 'typedi'
import AssetRepository from '../database/repositories/AssetRepository'
import { Asset, NewAsset } from '../types'
import { createRequestLogger } from '../utils/logger'

@Service()
class AssetService {
  private readonly logger = createRequestLogger('AssetService')

  constructor(private readonly assetRepository: AssetRepository) {}

  public getAssets = async (): Promise<Asset[]> => {
    this.logger.info('Retrieving all assets')
    try {
      const assets = await this.assetRepository.findAll()
      this.logger.info({ count: assets.length }, 'Successfully retrieved assets')
      return assets
    } catch (error) {
      this.logger.error({ error }, 'Failed to retrieve assets')
      throw error
    }
  }

  public getAsset = async (id: string): Promise<Asset> => {
    this.logger.info({ assetId: id }, 'Retrieving asset by id')
    try {
      const asset = await this.assetRepository.findById(id)
      this.logger.info({ assetId: id, assetName: asset.fileName }, 'Successfully retrieved asset')
      return asset
    } catch (error) {
      this.logger.error({ error, assetId: id }, 'Failed to retrieve asset')
      throw error
    }
  }

  public createAsset = async (asset: NewAsset): Promise<Asset> => {
    this.logger.info({ assetName: asset.fileName }, 'Creating new asset')
    try {
      const createdAsset = await this.assetRepository.create(asset)
      this.logger.info({ assetId: createdAsset.id, assetName: createdAsset.fileName }, 'Successfully created asset')
      return createdAsset
    } catch (error) {
      this.logger.error({ error, assetName: asset.fileName }, 'Failed to create asset')
      throw error
    }
  }

  public updateAsset = async (id: string, asset: NewAsset): Promise<Asset> => {
    this.logger.info({ assetId: id, assetName: asset.fileName }, 'Updating asset')
    try {
      const updatedAsset = await this.assetRepository.update(id, asset)
      this.logger.info({ assetId: id, assetName: updatedAsset.fileName }, 'Successfully updated asset')
      return updatedAsset
    } catch (error) {
      this.logger.error({ error, assetId: id }, 'Failed to update asset')
      throw error
    }
  }

  public deleteAsset = async (id: string): Promise<void> => {
    this.logger.info({ assetId: id }, 'Deleting asset')
    try {
      await this.assetRepository.delete(id)
      this.logger.info({ assetId: id }, 'Successfully deleted asset')
    } catch (error) {
      this.logger.error({ error, assetId: id }, 'Failed to delete asset')
      throw error
    }
  }
}

export default AssetService
