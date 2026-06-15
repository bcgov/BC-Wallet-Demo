import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface PreviewPanelProps {
  isExpanded: boolean
  iframeRefreshKey: number
  showcaseName: string
  urlPath: string
  type?: string
}

export function PreviewPanel({ isExpanded, iframeRefreshKey, showcaseName, urlPath, type }: PreviewPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const typeParam = type || urlPath

  // Build URL with proper query parameter encoding using client app origin
  const params = new URLSearchParams({
    refresh: String(iframeRefreshKey),
    type: typeParam,
    showcase: showcaseName,
  })
  const src = `${window.location.origin}/digital-trust/showcase/preview/${urlPath}?${params.toString()}`

  // Handle fullscreen mode and keyboard escape
  useEffect(() => {
    if (!isFullscreen) return

    // Store the previous overflow value to restore it later
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false)
      }
    }

    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      // Restore the previous overflow value instead of always resetting to 'unset'
      document.body.style.overflow = previousOverflow
    }
  }, [isFullscreen])

  // Exit fullscreen when panel is collapsed
  useEffect(() => {
    if (!isExpanded && isFullscreen) {
      setIsFullscreen(false)
    }
  }, [isExpanded])

  const previewContent = (
    <div
      className={`border border-gray-300 rounded-lg bg-gray-800 overflow-hidden shadow-lg ${isFullscreen ? 'h-full' : ''}`}
    >
      <div className="bg-gray-700 px-4 py-2 border-b border-gray-600 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Preview</h3>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="text-white hover:bg-gray-600 rounded p-1 transition-colors"
          title={isFullscreen ? 'Exit fullscreen (ESC)' : 'Expand to fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Expand to fullscreen'}
        >
          {isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
        </button>
      </div>
      <div
        style={
          isFullscreen
            ? { width: '100%', height: 'calc(100% - 40px)' }
            : { width: '100%', height: '460px', overflow: 'hidden' }
        }
      >
        <iframe
          key={iframeRefreshKey}
          src={src}
          style={
            isFullscreen
              ? { transform: 'scale(1)', width: '100%', height: '100%' }
              : { transform: 'scale(0.50)', transformOrigin: 'top left', width: '200%', height: '200%' }
          }
          className="border-none"
          title="Client Preview"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  )

  if (isFullscreen) {
    return <div className="fixed inset-0 bg-black z-50">{previewContent}</div>
  }

  return (
    <AnimatePresence mode="wait">
      {isExpanded && (
        <motion.div
          className="flex-shrink-0 bg-gray-50 rounded-lg p-4 sticky top-8"
          style={{ width: '600px' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {previewContent}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
