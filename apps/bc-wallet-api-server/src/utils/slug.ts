import { eq } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import slugify from 'slugify'
import { GenerateSlugArgs } from '../types'

export const generateSlug = async (args: GenerateSlugArgs): Promise<string> => {
  const { value, connection, schema } = args
  let slug = slugify(value.replace(/_/g, '-'), { lower: true, strict: true })
  const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 6)
  while ((await connection.select().from(schema).where(eq(schema.slug, slug)).execute()).length > 0) {
    slug = `${slug}-${nanoid()}`
  }

  return slug
}
