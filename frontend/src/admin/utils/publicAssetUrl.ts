import { publicBaseUrl } from '../api/adminApi'

export function getPublicAssetUrl(assetPath?: string): string | undefined {
  if (!assetPath) return undefined

  const hasControlCharacter = Array.from(assetPath).some((character) => {
    const codePoint = character.charCodeAt(0)
    return codePoint <= 31 || codePoint === 127
  })
  if (hasControlCharacter) return undefined

  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`
  return `${publicBaseUrl}${encodeURI(normalizedPath)}`
}
