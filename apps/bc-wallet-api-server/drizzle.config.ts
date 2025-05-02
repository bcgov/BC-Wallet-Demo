import { defineConfig } from 'drizzle-kit'

const dbUrl =
  process.env.DB_URL ??
  `postgresql://${process.env.SHOWCASE_DB_USERNAME}${process.env.SHOWCASE_DB_PASSWORD && `:${process.env.SHOWCASE_DB_PASSWORD}`}${process.env.SHOWCASE_DB_HOST && `@${process.env.SHOWCASE_DB_HOST}`}${process.env.SHOWCASE_DB_PORT && `:${process.env.SHOWCASE_DB_PORT}`}/${process.env.SHOWCASE_DB_NAME}`

const drizzleConfig = defineConfig({
  out: './src/database/migrations',
  schema: './src/database/schema/*',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
})

export default drizzleConfig
