export class ShowcaseNotDeletedError extends Error {
  public constructor(showcaseName: string) {
    super(`Showcase "${showcaseName}" is not soft-deleted.`)
    this.name = 'ShowcaseNotDeletedError'
  }
}
