/**
 * Converts a screen ID from snake_case to Title Case
 * @param screenId - The screen ID in snake_case format (e.g., "intro_screen")
 * @returns The formatted screen ID in Title Case (e.g., "Intro Screen")
 */
export function formatScreenId(screenId: string): string {
  return screenId
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
