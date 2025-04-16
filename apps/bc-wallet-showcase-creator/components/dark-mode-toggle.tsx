'use client'

import { useMounted } from '@/hooks/use-mounted'
import { cn } from '@/lib/utils'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Skeleton } from './ui/skeleton'

export const DarkModeToggle = ({ isExpanded = false }: { isExpanded?: boolean }) => {
  const { theme, setTheme } = useTheme()
  const isMounted = useMounted()

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!isMounted) {
    return <Skeleton className="border-2 w-16 h-9 bg-transparent rounded-full" />
  }

  return (
    <button onClick={toggleDarkMode}>
      <div
        className={cn(
          'rounded-full p-1 px-2 transition-all border border-gray-200 dark:border-dark-border bg-light-bg dark:bg-dark-bg flex items-center',
          isExpanded ? 'w-18' : 'w-8'
        )}
      >
        {theme === 'dark' ? (
          <Sun className={cn('transition-all', isExpanded ? 'w-6 h-6 ml-7' : 'w-5 h-5')} />
        ) : (
          <Moon className={cn('transition-all', isExpanded ? 'w-6 h-6 mr-6' : 'w-5 h-5')} />
        )}
      </div>
    </button>
  )
}
