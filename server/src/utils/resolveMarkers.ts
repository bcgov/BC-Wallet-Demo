import { getDateInt } from './dateint'

const DATEINT_RE = /^\$dateint:(-?\d+)$/

export function resolveMarker(value: string | number): string | number {
  if (typeof value !== 'string') return value
  const match = DATEINT_RE.exec(value)
  if (match) return getDateInt(parseInt(match[1], 10))
  return value
}

export function resolveCredentialAttributes(
  attributes: { name: string; value: string | number }[],
): { name: string; value: string | number }[] {
  return attributes.map((attr) => ({ ...attr, value: resolveMarker(attr.value) }))
}
