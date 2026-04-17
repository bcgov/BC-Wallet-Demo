export function getMongoUri(): string {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI

  const host = process.env.MONGODB_HOST || 'localhost'
  const port = process.env.MONGODB_PORT || '27017'
  const db = process.env.MONGODB_DB_NAME || 'bc_wallet_showcase'
  const user = process.env.MONGODB_USER
  const pass = process.env.MONGODB_PASSWORD

  if (user && pass) {
    const u = encodeURIComponent(user)
    const p = encodeURIComponent(pass)
    return `mongodb://${u}:${p}@${host}:${port}/${db}?authSource=admin`
  }

  return `mongodb://${host}:${port}/${db}`
}
