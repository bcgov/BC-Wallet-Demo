import fs from 'fs/promises'
import path from 'path'
import { Body, Delete, JsonController, NotFoundError, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'

import { Showcase } from '../../content/types'
import { AssetModel } from '../../db/models/Asset'
import { ShowcaseModel } from '../../db/models/Showcase'
import { ShowcaseNotDeletedError } from '../../errors'
import logger from '../../utils/logger'
import { UPLOADS_DIR } from '../../utils/uploadsDir'

@JsonController('/admin/showcases')
@Service()
export class AdminShowcaseController {
  /**
   * Create a new showcase
   * Note: Showcase name must be unique (enforced via database index).
   * Admin operations key off showcase name for updates/deletes.
   */
  @Post('/')
  public async createShowcase(@Body() body: Showcase) {
    logger.debug({ body }, 'Creating new showcase')
    try {
      const showcase = new ShowcaseModel(body)
      const saved = await showcase.save()
      logger.debug({ showcaseId: saved._id }, 'Showcase created successfully')
      return saved.toObject()
    } catch (error) {
      logger.error(error, 'Error creating showcase')
      throw error
    }
  }

  /**
   * Update a showcase by name
   * Showcase name is unique, so this operation is deterministic and safe.
   */
  @Put('/:showcaseName')
  public async updateShowcase(@Param('showcaseName') showcaseName: string, @Body() body: Partial<Showcase>) {
    logger.debug({ showcaseName, body }, 'Updating showcase')
    try {
      const showcase = await ShowcaseModel.findOneAndUpdate(
        { name: showcaseName, deleted_at: null },
        { $set: { ...body, deleted_at: undefined } },
        { new: true, runValidators: true },
      ).lean()

      if (!showcase) {
        logger.warn({ showcaseName }, 'Showcase not found for update')
        throw new NotFoundError(`Showcase with name "${showcaseName}" not found.`)
      }

      logger.debug({ showcaseName }, 'Showcase updated successfully')
      return showcase
    } catch (error) {
      logger.error(error, 'Error updating showcase')
      throw error
    }
  }

  /**
   * Soft-delete a showcase by name (set deleted_at, keep data intact)
   * Showcase name is unique, so this operation is deterministic and safe.
   */
  @Delete('/:showcaseName')
  public async deleteShowcase(@Param('showcaseName') showcaseName: string) {
    logger.debug({ showcaseName }, 'Soft-deleting showcase')
    try {
      const result = await ShowcaseModel.findOneAndUpdate(
        { name: showcaseName, deleted_at: null },
        { deleted_at: new Date() },
        { new: true },
      ).lean()

      if (!result) {
        logger.warn({ showcaseName }, 'Showcase not found for soft-deletion')
        throw new NotFoundError(`Showcase with name "${showcaseName}" not found.`)
      }

      logger.debug({ showcaseName }, 'Showcase soft-deleted successfully')
      return { message: 'Showcase deleted successfully' }
    } catch (error) {
      logger.error(error, 'Error deleting showcase')
      throw error
    }
  }

  /**
   * Restore a soft-deleted showcase by name
   * Returns 409 if showcase is not currently deleted.
   */
  public async restoreShowcase(showcaseName: string) {
    logger.debug({ showcaseName }, 'Restoring showcase')
    try {
      const result = await ShowcaseModel.findOneAndUpdate(
        { name: showcaseName, deleted_at: { $ne: null } },
        { deleted_at: null, status: 'pending' },
        { new: true },
      ).lean()

      if (!result) {
        // Check if showcase exists but isn't deleted
        const existing = await ShowcaseModel.findOne({ name: showcaseName }).lean()
        if (existing) {
          logger.warn({ showcaseName }, 'Showcase not deleted, cannot restore')
          throw new ShowcaseNotDeletedError(showcaseName)
        }
        // Showcase doesn't exist at all
        logger.warn({ showcaseName }, 'Showcase not found for restore')
        throw new NotFoundError(`Showcase with name "${showcaseName}" not found.`)
      }

      logger.debug({ showcaseName }, 'Showcase restored successfully')
      return result
    } catch (error) {
      logger.error(error, 'Error restoring showcase')
      throw error
    }
  }

  /**
   * List soft-deleted showcases with pagination
   */
  public async getDeletedShowcases(limit: number = 20, skip: number = 0) {
    logger.debug({ limit, skip }, 'Fetching deleted showcases')
    try {
      const items = await ShowcaseModel.find({ deleted_at: { $ne: null } })
        .sort({ deleted_at: -1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
      const total = await ShowcaseModel.countDocuments({ deleted_at: { $ne: null } })
      return { items, total }
    } catch (error) {
      logger.error(error, 'Error fetching deleted showcases')
      throw error
    }
  }

  /**
   * Extract asset filenames from showcase image paths
   */
  private extractAssetFilenames(showcase: Showcase & { _id?: unknown }): string[] {
    const paths: (string | undefined)[] = [
      showcase.persona?.image,
      ...showcase.introduction.map((s) => s.image),
      ...showcase.progressBar.map((s) => s.iconLight),
      ...showcase.progressBar.map((s) => s.iconDark),
      ...(showcase.revocationInfo ?? []).map((r) => r.credentialIcon),
    ]
    return paths.filter((p): p is string => !!p).map((p) => path.basename(p))
  }

  /**
   * Permanently delete a showcase (must already be soft-deleted)
   * Removes document, embedded scenarios, asset files, and Asset DB records.
   */
  public async permanentDeleteShowcase(showcaseName: string) {
    logger.debug({ showcaseName }, 'Permanently deleting showcase')
    try {
      // 1. Atomically delete -- only if soft-deleted
      const showcase = await ShowcaseModel.findOneAndDelete({
        name: showcaseName,
        deleted_at: { $ne: null },
      }).lean<Showcase & { _id?: unknown }>()

      if (!showcase) {
        // Distinguish 404 from 409
        const exists = await ShowcaseModel.findOne({ name: showcaseName }).lean()
        if (exists) {
          logger.warn({ showcaseName }, 'Showcase not soft-deleted, cannot permanently delete')
          throw new ShowcaseNotDeletedError(showcaseName)
        }
        logger.warn({ showcaseName }, 'Showcase not found for permanent deletion')
        throw new NotFoundError(`Showcase with name "${showcaseName}" not found.`)
      }

      // 2. Extract filenames from deleted showcase (dedupe to avoid repeated checks/unlinks)
      const filenames = [...new Set(this.extractAssetFilenames(showcase))]

      // 3. Check which filenames are safe to delete (not used by other active showcases)
      // TODO: batch this into a single aggregation query if showcase count grows -- currently N regex scans per filename
      const safeFilenames = (
        await Promise.all(
          filenames.map(async (filename) => {
            const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const pattern = new RegExp(`${escaped}$`)
            const count = await ShowcaseModel.countDocuments({
              deleted_at: null,
              $or: [
                { 'persona.image': { $regex: pattern } },
                { 'introduction.image': { $regex: pattern } },
                { 'progressBar.iconLight': { $regex: pattern } },
                { 'progressBar.iconDark': { $regex: pattern } },
                { 'revocationInfo.credentialIcon': { $regex: pattern } },
              ],
            })
            return count === 0 ? filename : null
          }),
        )
      ).filter((f): f is string => f !== null)

      // 4. Delete asset files from disk (best-effort, ignore missing files)
      const uploadsBase = path.resolve(UPLOADS_DIR)
      await Promise.all(
        safeFilenames.map(async (filename) => {
          const diskPath = path.resolve(UPLOADS_DIR, filename)
          // Prevent path traversal: resolved path must stay inside UPLOADS_DIR
          if (!diskPath.startsWith(uploadsBase + path.sep)) return
          await fs.unlink(diskPath).catch((err: NodeJS.ErrnoException) => {
            if (err.code !== 'ENOENT') {
              logger.warn({ err, diskPath, showcaseName }, 'Permanent delete: failed to delete asset file')
            }
          })
        }),
      )
      logger.debug({ count: safeFilenames.length }, 'Asset files deleted')

      // 5. Delete Asset DB records for safe filenames only
      if (safeFilenames.length > 0) {
        await AssetModel.deleteMany({ filename: { $in: safeFilenames } })
        logger.debug({ count: safeFilenames.length }, 'Asset DB records deleted')
      }

      logger.debug({ showcaseName }, 'Showcase permanently deleted successfully')
      return { message: 'Showcase permanently deleted' }
    } catch (error) {
      logger.error(error, 'Error permanently deleting showcase')
      throw error
    }
  }
}
