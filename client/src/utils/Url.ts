import { baseUrl } from '../api/BaseUrl'

export function prependApiUrl(path: string) {
  let fullPath = `${baseUrl}${path}`

  if (path.startsWith('data:')) {
    // path is a data url treat it as is
    fullPath = path
  }
  return fullPath
}
