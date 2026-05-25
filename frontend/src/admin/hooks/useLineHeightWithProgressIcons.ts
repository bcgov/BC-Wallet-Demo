import { useEffect, useState } from 'react'

export function useLineHeightWithProgressIcons(
  containerRef: React.RefObject<HTMLDivElement>,
  dependencies: React.DependencyList,
) {
  const [lineHeight, setLineHeight] = useState<string>('auto')

  useEffect(() => {
    const calculateLineHeight = () => {
      if (containerRef.current) {
        // Find the first numbered circle
        const firstCircle = containerRef.current.querySelector('[data-first-circle]')
        // Find all progress icon containers and get the last one
        const allIcons = containerRef.current.querySelectorAll(
          '.flex-shrink-0.flex.flex-col.items-center.gap-2 .w-12.h-12',
        )
        const lastIcon = allIcons.length > 0 ? allIcons[allIcons.length - 1] : null

        if (firstCircle && lastIcon) {
          const container = containerRef.current
          const containerRect = container.getBoundingClientRect()
          const firstRect = firstCircle.getBoundingClientRect()
          const lastRect = lastIcon.getBoundingClientRect()

          // Calculate positions relative to container
          const topOffset = firstRect.top - containerRect.top + firstRect.height / 2
          const bottomOffset = containerRect.bottom - lastRect.bottom + lastRect.height / 2

          setLineHeight(`calc(100% - ${topOffset}px - ${bottomOffset}px)`)
        }
      }
    }

    calculateLineHeight()

    // Listen for window resize
    window.addEventListener('resize', calculateLineHeight)

    // Create ResizeObserver to watch container changes
    const resizeObserver = new ResizeObserver(calculateLineHeight)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', calculateLineHeight)
      resizeObserver.disconnect()
    }
  }, dependencies)

  return lineHeight
}
