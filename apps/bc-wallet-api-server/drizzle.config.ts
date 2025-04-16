import { defineConfig } from 'drizzle-kit'

const dbUrl =
  process.env.DB_URL ??
  `postgresql://${process.env.DB_USERNAME}${process.env.DB_PASSWORD && `:${process.env.DB_PASSWORD}`}${process.env.DB_HOST && `@${process.env.DB_HOST}`}${process.env.DB_PORT && `:${process.env.DB_PORT}`}/${process.env.DB_NAME}`

const drizzleConfig = defineConfig({
  out: './src/database/migrations',
  schema: './src/database/schema/*',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
})

export default drizzleConfig
