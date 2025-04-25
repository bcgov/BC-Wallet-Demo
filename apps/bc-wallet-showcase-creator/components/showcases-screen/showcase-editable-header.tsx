'use client'

import { Pencil } from "lucide-react"
import { useTranslations } from "next-intl"

export const ShowcaseEditableHeader = () => {
  const t = useTranslations()
  
  return (
    <div className="flex items-center space-x-4">
    <span className="text-light-text dark:text-dark-text font-medium text-sm">Showcase1 </span>
    <Pencil size={16} />
    <span className="rounded-[5px] bg-gray-500 px-3 py-1 min-w-24 text-center min-h-4 text-sm text-white">
      {t('showcases.header_tab_draft')}
    </span>
  </div>
  )
}