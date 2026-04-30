import 'dotenv/config'

import mongoose from 'mongoose'

import { connectDB } from '../src/db/connection'
import { ShowcaseModel } from '../src/db/models/Showcase'
import showcases from '../src/content/Showcases'

export async function runSeed(): Promise<void> {
  const results = await Promise.all(
    showcases.map((showcase) =>
      ShowcaseModel.findOneAndUpdate({ 'persona.type': showcase.persona.type }, { $set: showcase }, {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      }),
    ),
  )

  console.log(`Seeded ${results.length} showcase(s):`, results.map((r) => r?.persona.type).join(', '))
}

if (require.main === module) {
  connectDB()
    .then(runSeed)
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}
