'use client'

import type { PageParams } from '@/types'
import { useTranslations } from 'next-intl'
import { PublishEdit } from './publish-edit'
import { PublishInfo } from './publish-info'

export default function PublishMain({ params }: { params: PageParams }) {
  const t = useTranslations()
  return (
    <div className="flex text-light-text dark:bg-dark-bg dark:text-dark-text flex-col h-full w-full bg-gray-100">
      <div className="flex flex-col h-full">
        <div className="flex gap-4 p-4 h-full">
          <div className="w-1/3 bg-[white] dark:bg-dark-bg-secondary border shadow-md rounded-md flex flex-col">
            <div className="p-4 border-b shadow">
              <h2 className="text-base font-bold text-foreground"> {t('showcases.publish_info_title')}</h2>
              <p className="w-full text-xs text-foreground/80">{t('showcase.publish_info_subtitle')}</p>
            </div>
            <PublishInfo characters={[]} credentials={[]} />
          </div>
          <div className="w-2/3 bg-white dark:bg-dark-bg-secondary border shadow-md rounded-md flex flex-col">
            <PublishEdit />
          </div>
        </div>
      </div>
    </div>
  )
}
