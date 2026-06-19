/**
 * Converts a $dateint marker to a human-readable display string.
 *
 * Supported markers:
 *   `$dateint:0`   → 'Time of issuance'
 *   `$dateint:1`   → 'Time of issuance + 1 years'
 *   `$dateint:-19` → 'Time of issuance - 19 years'
 *
 * @param value - The predicate value to format
 * @returns Formatted display string, or the original value if not a $dateint marker
 */
export function formatPredicateValue(value: any): string | number {
  if (typeof value === 'string' && value.startsWith('$dateint:')) {
    const years = parseInt(value.replace('$dateint:', ''), 10)
    if (!isNaN(years)) {
      if (years === 0) {
        return 'Time of issuance'
      } else {
        const operator = years > 0 ? '+' : '-'
        return `Time of issuance ${operator} ${Math.abs(years)} years`
      }
    }
  }
  return value
}

/**
 * Truncates extremely long strings (like base64-encoded images) to a readable length.
 *
 * @param value - The string to truncate
 * @param maxLength - Maximum length before truncation (default: 100)
 * @returns Truncated string with ellipsis, or original value if not a string or shorter than maxLength
 */
export function truncateLongString(value: any, maxLength: number = 100): string | number {
  if (typeof value === 'string' && value.length > maxLength) {
    return `${value.substring(0, maxLength)}...`
  }
  return value
}
