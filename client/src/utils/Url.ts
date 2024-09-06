import { baseRoute } from "../api/BaseUrl"

export function prependApiUrl(path: string) {
  let fullPath = `${process.env.REACT_APP_HOST_BACKEND ?? ''}${baseRoute}${path}`

  if (path.startsWith('data:')) {
    // path is a data url treat it as is
    fullPath = path
  }
  return fullPath
}
