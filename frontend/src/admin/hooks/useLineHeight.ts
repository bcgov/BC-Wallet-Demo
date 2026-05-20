import { useEffect, useState } from 'react'

export function useLineHeight(containerRef: React.RefObject<HTMLDivElement>, dependencies: unknown[]) {
  const [lineHeight, setLineHeight] = useState<string>('auto')

  useEffect(() => {
    const calculateLineHeight = () => {
      if (containerRef.current) {
        const firstCircle = containerRef.current.querySelector('[data-first-circle]')
        const lastCircle = containerRef.current.querySelector('[data-last-circle]')

        if (firstCircle && lastCircle) {
          const container = containerRef.current
          const containerRect = container.getBoundingClientRect()
          const firstRect = firstCircle.getBoundingClientRect()
          const lastRect = lastCircle.getBoundingClientRect()

          const topOffset = firstRect.top - containerRect.top + firstRect.height / 2
          const bottomOffset = containerRect.bottom - lastRect.bottom + lastRect.height / 2

          setLineHeight(`calc(100% - ${topOffset}px - ${bottomOffset}px)`)
        }
      }
    }

    calculateLineHeight()

    window.addEventListener('resize', calculateLineHeight)

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
