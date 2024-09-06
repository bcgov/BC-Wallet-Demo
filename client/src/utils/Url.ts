export function prependApiUrl(path: string) {
  let fullPath = `${process.env.REACT_APP_HOST_BACKEND ?? ''}${process.env.REACT_APP_BASE_ROUTE}${path}`

  if (path.startsWith('data:')) {
    // path is a data url treat it as is
    fullPath = path
  }
  return fullPath
}
