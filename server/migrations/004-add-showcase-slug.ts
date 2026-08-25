import { ShowcaseModel } from '../src/db/models/Showcase'
import logger from '../src/utils/logger'
import { generateUniqueSlug, slugify } from '../src/utils/slug'

export async function up() {
  const showcases = await ShowcaseModel.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] })
  logger.info(`Migration 004: Backfilling slug for ${showcases.length} showcases`)

  const takenSlugs = new Set(
    (await ShowcaseModel.find({ slug: { $exists: true, $ne: null } }, { slug: 1 })).map((s) => s.slug),
  )

  for (const showcase of showcases) {
    try {
      const slug = await generateUniqueSlug(slugify(showcase.name), async (candidate) => takenSlugs.has(candidate))
      takenSlugs.add(slug)
      showcase.slug = slug
      await showcase.save()
    } catch (error) {
      logger.error({ showcase: showcase.name, error }, 'Error processing showcase in migration 004')
      throw error
    }
  }

  logger.info('Migration 004 completed')
}
