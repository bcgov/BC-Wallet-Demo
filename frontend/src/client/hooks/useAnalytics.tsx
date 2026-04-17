import { init, trackPages } from 'insights-js'
import { useEffect } from 'react'

export const useAnalytics = () => {
  useEffect(() => {
    const INSIGHTS_PROJECT_ID = import.meta.env.VITE_INSIGHTS_PROJECT_ID

    if (INSIGHTS_PROJECT_ID && INSIGHTS_PROJECT_ID !== '') {
      init(INSIGHTS_PROJECT_ID)
      trackPages()
    }
  }, [])
}
