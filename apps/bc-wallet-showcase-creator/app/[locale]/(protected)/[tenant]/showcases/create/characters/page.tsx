import TabsComponent from '@/components/Tabs-component'
import CharactersPage from '@/components/character-screen/characters'

export default function CharacterPageMain() {
  return (
    <div className="flex bg-light-bg dark:bg-dark-bg flex-col h-full w-full">
      <div className="flex flex-col">
        <div className="flex justify-between items-center px-6 py-2 mt-4">
          <div className="flex items-center space-x-4"></div>
          <div className="flex space-x-1 text-lg font-semibold justify-start">
            <TabsComponent slug={'create'} />
          </div>
        </div>

        <CharactersPage />
      </div>
    </div>
  )
}
