import TabsComponent from '@/components/Tabs-component'
import CharactersPage from '@/components/character-screen/characters'
import { ShowcaseEditableHeader } from '@/components/showcases-screen/showcase-editable-header'

export default async function CharacterPageMain({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <div className="flex bg-light-bg dark:bg-dark-bg flex-col h-full w-full">
      <div className="flex flex-col">
        <div className="flex justify-between items-center px-6 py-2 mt-4">
          <ShowcaseEditableHeader />
          <div className="flex space-x-1 text-lg font-semibold justify-end">
            <TabsComponent slug={slug} />
          </div>
        </div>

        <CharactersPage slug={slug} />
      </div>
    </div>
  )
}
