import { Service } from 'typedi'
import AssetRepository from '../database/repositories/AssetRepository'
import { Asset, NewAsset } from '../types'

@Service()
class AssetService {
  constructor(private readonly assetRepository: AssetRepository) {}

  public getAssets = async (): Promise<Asset[]> => {
    return this.assetRepository.findAll()
  }

  public getAsset = async (id: string): Promise<Asset> => {
    return this.assetRepository.findById(id)
  }

  public createAsset = async (asset: NewAsset): Promise<Asset> => {
    return this.assetRepository.create(asset)
  }

  public updateAsset = async (id: string, asset: NewAsset): Promise<Asset> => {
    return this.assetRepository.update(id, asset)
  }

  public deleteAsset = async (id: string): Promise<void> => {
    return this.assetRepository.delete(id)
  }
}

export default AssetService
