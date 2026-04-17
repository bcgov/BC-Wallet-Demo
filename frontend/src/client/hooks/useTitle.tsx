import { useEffect } from 'react'

export const useTitle = (title: string) => {
  useEffect(() => {
    if (title) {
      document.title = title
    }
  }, [title])
}
