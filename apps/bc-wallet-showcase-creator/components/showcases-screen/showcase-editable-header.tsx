'use client'

import { useState, useRef, useEffect } from 'react'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { usePathname, useRouter } from '@/i18n/routing'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useShowcase } from '@/hooks/use-showcases'
import { Skeleton } from '@/components/ui/skeleton'

export const ShowcaseEditableHeader = ({ showcaseSlug }: { showcaseSlug: string }) => {
  const t = useTranslations()
  const { data: showcaseData, isLoading: isShowcaseLoading } = useShowcase(showcaseSlug)
  const { updateShowcaseName } = useOnboardingAdapter(showcaseSlug)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (showcaseData?.showcase?.name) {
      setName(showcaseData.showcase.name)
    }
  }, [showcaseData?.showcase?.name])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setName(showcaseData?.showcase?.name || '')
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (name.trim() === '' || name === showcaseData?.showcase?.name) {
      handleCancel()
      return
    }

    setIsLoading(true)
    try {
      if (showcaseData?.showcase) {
        const result = await updateShowcaseName(name, showcaseData?.showcase)
        if (result && result.success && result.slug) {
          const pattern = new RegExp(`(/showcases/${showcaseSlug})($|/.*$)`)
          
          if (pattern.test(pathname)) {
            const newPath = pathname.replace(pattern, `/showcases/${result.slug}$2`)
            router.push(newPath)
          } else {
            router.push(`/showcases/${result.slug}`)
          }
          
          setIsEditing(false)
        } else {
          console.error(result?.message || 'Failed to update showcase name')
        }
      }
    } catch (error) {
      console.error('Error updating showcase name:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isShowcaseLoading) {
    return (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-[5px]" />
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 w-64 text-sm"
            placeholder={t('showcases.name_placeholder')}
            disabled={isLoading}
          />
          <Button size="icon" variant="ghost" onClick={handleSave} disabled={isLoading} className="h-8 w-8">
            {isLoading ? (
              <Loader2 size={16} className="animate-spin text-gray-500" />
            ) : (
              <Check size={16} className="text-green-500" />
            )}
          </Button>
          <Button size="icon" variant="ghost" onClick={handleCancel} disabled={isLoading} className="h-8 w-8">
            <X size={16} className="text-red-500" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-light-text dark:text-dark-text font-medium text-sm">
            {showcaseData?.showcase?.name || showcaseSlug}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={handleEdit} className="h-6 w-6 p-1">
                  <Pencil size={16} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('showcases.edit_name_tooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <span className="rounded-[5px] bg-gray-500 px-3 py-1 min-w-24 text-center min-h-4 text-sm text-white">
        {showcaseData?.showcase?.status
          ? t(`showcases.header_tab_${showcaseData?.showcase?.status.toLowerCase()}`)
          : t('showcases.header_tab_draft')}
      </span>
    </div>
  )
}