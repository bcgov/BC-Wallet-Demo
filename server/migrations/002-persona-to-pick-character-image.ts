import mongoose from 'mongoose'

import { ShowcaseModel } from '../src/db/models/Showcase'
import logger from '../src/utils/logger'

export async function up() {
  // Create a new session to ensure fresh reads from MongoDB
  // This is important in distributed setups where previous migrations may have just completed
  const session = await mongoose.startSession()

  try {
    logger.info('Migration 002: Starting persona image to PICK_CHARACTER screen transfer')
    const showcases = await ShowcaseModel.find().session(session)
    let updatedCount = 0

    for (const showcase of showcases) {
      try {
        const pickCharacterScreen = showcase.introduction?.find((s) => s.screenId === 'PICK_CHARACTER')

        if (pickCharacterScreen && !pickCharacterScreen.image && showcase.persona?.image) {
          pickCharacterScreen.image = showcase.persona.image
          await showcase.save()
          updatedCount++
        }
      } catch (error) {
        logger.error({ showcase: showcase.name, error }, 'Error processing showcase in migration 002')
        throw error
      }
    }

    logger.info({ updatedCount }, 'Migration 002 completed')
  } catch (error) {
    logger.error({ error }, 'Error in migration 002')
    throw error
  } finally {
    await session.endSession()
  }
}
