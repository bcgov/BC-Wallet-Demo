'use client'


import { ShowcaseCreate } from '@/components/publish-screen/showcase-create'
import { Instructions } from '@/components/showcases-screen/instructions'
import TabsComponent from '@/components/Tabs-component'
import { useTranslations } from 'next-intl'

export default function CreateOnboardingPage() {
  const t = useTranslations()

  return (
    <div className="flex bg-light-bg dark:bg-dark-bg flex-col h-full w-full">
      <div className="flex flex-col">
        <div className="flex justify-between items-center px-6 py-2 mt-4">
          <div className="flex items-center space-x-4"></div>
          <div className="flex space-x-1 text-lg font-semibold justify-start">
            <TabsComponent slug={'create'} />
          </div>
        </div>

        <div className="flex gap-4 p-4 h-fit-content">
          <Instructions />
          <div className="w-2/3 bg-white dark:bg-dark-bg-secondary border shadow-md rounded-md flex flex-col">
            <ShowcaseCreate />
          </div>
        </div>
      </div>
    </div>
  )
}
