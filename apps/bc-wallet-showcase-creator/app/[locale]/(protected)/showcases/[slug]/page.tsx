import TabsComponent from '@/components/Tabs-component'
import { Pencil } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Instructions } from '@/components/showcases-screen/instructions'
import { ShowcaseEdit } from '@/components/publish-screen/showcase-edit'
import { ShowcaseEditableHeader } from '@/components/showcases-screen/showcase-editable-header'

export default async function PublishPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <div className="flex bg-light-bg dark:bg-dark-bg flex-col h-full w-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center px-6 py-2 mt-4">
          <ShowcaseEditableHeader />
          <div className="flex space-x-1 text-lg font-semibold justify-end">
            <TabsComponent slug={slug} />
          </div>
        </div>
        <div className="flex gap-4 p-4 h-fit-content">
          <Instructions />
          <div className="w-2/3 bg-background border shadow-md rounded-md flex flex-col">
            <ShowcaseEdit slug={slug}/>
          </div>
        </div>
      </div>
    </div>
  )
}
