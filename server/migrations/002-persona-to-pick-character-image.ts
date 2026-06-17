import { ShowcaseModel } from '../src/db/models/Showcase'

export async function up() {
  const showcases = await ShowcaseModel.find()

  for (const showcase of showcases) {
    const pickCharacterScreen = showcase.introduction?.find((s) => s.screenId === 'PICK_CHARACTER')

    if (pickCharacterScreen && !pickCharacterScreen.image && showcase.persona?.image) {
      pickCharacterScreen.image = showcase.persona.image
      await showcase.save()
    }
  }
}
