import { useEffect, useState } from 'react'

/**
 * Custom hook for managing error display with auto-dismiss functionality.
 * Handles timer cleanup on unmount.
 *
 * @param autoDismissMs - Milliseconds before auto-dismissing error (default: 6000ms)
 * @returns Object containing error state and helper functions
 */
export function useErrorDisplay(autoDismissMs: number = 6000) {
  const [error, setError] = useState<string | null>(null)
  const [errorDismissTimer, setErrorDismissTimer] = useState<NodeJS.Timeout | null>(null)

  const displayError = (message: string) => {
    // Clear any existing auto-dismiss timer
    if (errorDismissTimer) {
      clearTimeout(errorDismissTimer)
    }
    setError(message)
    // Auto-dismiss after specified time
    const timer = setTimeout(() => setError(null), autoDismissMs)
    setErrorDismissTimer(timer)
  }

  const dismissError = () => {
    if (errorDismissTimer) {
      clearTimeout(errorDismissTimer)
      setErrorDismissTimer(null)
    }
    setError(null)
  }

  // Cleanup: clear timer on unmount
  useEffect(() => {
    return () => {
      if (errorDismissTimer) {
        clearTimeout(errorDismissTimer)
      }
    }
  }, [errorDismissTimer])

  return {
    error,
    setError,
    displayError,
    dismissError,
  }
}
