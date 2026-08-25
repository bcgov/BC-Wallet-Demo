/** Normalizes a string into a URL-safe, lowercase kebab-case slug. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Appends -2, -3, ... to `base` until `isTaken` reports the candidate is free. */
export async function generateUniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
  const root = base || 'showcase'
  let candidate = root
  let suffix = 2
  while (await isTaken(candidate)) {
    candidate = `${root}-${suffix}`
    suffix += 1
  }
  return candidate
}
