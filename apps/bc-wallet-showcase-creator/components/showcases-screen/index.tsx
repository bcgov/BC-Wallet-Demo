'use client'

import EditScenarioCharacterPage from '@/components/character-screen/scenario-character-edit'
import { useShowcase } from '@/hooks/use-showcases'
import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { redirect } from 'next/navigation'

import TabsComponent from '../Tabs-component'

export default function MyShowcaseMain({ slug }: { slug: string }) {
  const { data, isLoading, error } = useShowcase(slug)
  const t = useTranslations()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return redirect('/')
  }

  return (
    <div className="flex bg-light-bg dark:bg-dark-bg flex-col h-full w-full">
      <div className="flex flex-col">
        <div className="flex justify-between items-center px-6 py-2 mt-4">
          <div className="flex items-center space-x-4">
            <span className="text-light-text dark:text-dark-text font-medium text-sm">{data?.showcase?.name || ''}</span>
            <Pencil size={16} />
            <span className="rounded-[5px] bg-gray-500 px-3 py-1 min-w-24 text-center min-h-4 text-sm text-white">
              {t('showcases.header_tab_draft')}
            </span>
          </div>

          <div className="flex space-x-1 text-lg font-semibold justify-start">
            <TabsComponent slug={slug} />
          </div>
        </div>

        <EditScenarioCharacterPage slug={slug} />
      </div>
    </div>
  )
}
