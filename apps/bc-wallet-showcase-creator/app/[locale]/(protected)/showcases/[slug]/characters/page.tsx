import TabsComponent from '@/components/Tabs-component'
import CharactersPage from '@/components/character-screen/characters'
import { Pencil } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function CharacterPageMain({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const t = await getTranslations()

  return (
    <div className="flex bg-light-bg dark:bg-dark-bg flex-col h-full w-full">
      <div className="flex flex-col">
        <div className="flex justify-between items-center px-6 py-2 mt-4">
          <div className="flex items-center space-x-4">
            <span className="text-light-text dark:text-dark-text font-medium text-sm">{slug}</span>
            <Pencil size={16} />
            <span className="rounded-[5px] bg-gray-500 px-3 py-1 min-w-24 text-center min-h-4 text-sm text-white">
              {t('showcases.header_tab_draft')}
            </span>
          </div>
          <div className="flex space-x-1 text-lg font-semibold justify-start">
            <TabsComponent slug={slug} />
          </div>
        </div>

        <CharactersPage />
      </div>
    </div>
  )
}
