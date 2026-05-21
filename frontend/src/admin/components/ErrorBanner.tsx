interface ErrorBannerProps {
  error: string | null
  onDismiss: () => void
  title?: string
  variant?: 'bottom-border' | 'left-border'
}

/**
 * Reusable error banner component for displaying errors with auto-dismiss functionality.
 * Used with useErrorDisplay hook for consistent error handling across admin UI.
 */
export function ErrorBanner({ error, onDismiss, title = 'Error', variant = 'bottom-border' }: ErrorBannerProps) {
  if (!error) return null

  const borderClass = variant === 'left-border' ? 'border-l-4 border-red-500' : 'border-b border-red-200'
  const containerClass = variant === 'left-border' ? 'w-full mb-6 rounded' : ''

  return (
    <div className={`${borderClass} bg-red-50 p-4 ${containerClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-red-900">{title}</h3>
          <p className="text-sm text-red-800 mt-1">{error}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-700 font-medium text-sm px-3 py-1 rounded hover:bg-red-100 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
