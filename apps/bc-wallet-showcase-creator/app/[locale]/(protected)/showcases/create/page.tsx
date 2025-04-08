'use client'


import { ShowcaseCreate } from '@/components/publish-screen/showcase-create'
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
          <div className="w-1/3 bg-[white] dark:bg-dark-bg-secondary border shadow-md rounded-md flex flex-col">
            <div className="p-4 border-b shadow">
              <h2 className="text-base font-bold text-foreground">How to create a showcase</h2>
              <p className="w-full text-xs text-foreground/80">
                This is a step by step guide to help you create a showcase.
              </p>
            </div>
            <div className="p-4">
              <ul className="flex flex-col gap-4">
                <li className="flex flex-col gap-2">
                  <h3 className="text-sm font-bold">Step 1: Create a showcase</h3>
                  <p className="text-xs text-foreground/80">This is the first step to create a showcase.</p>
                </li>
                <li className="flex flex-col gap-2">
                  <h3 className="text-sm font-bold">Step 2: Create a showcase</h3>
                  <p className="text-xs text-foreground/80">This is the first step to create a showcase.</p>
                </li>
                <li className="flex flex-col gap-2">
                  <h3 className="text-sm font-bold">Step 3: Create a showcase</h3>
                  <p className="text-xs text-foreground/80">This is the first step to create a showcase.</p>
                </li>
              </ul>
            </div>
          </div>
          <div className="w-2/3 bg-white dark:bg-dark-bg-secondary border shadow-md rounded-md flex flex-col">
            <ShowcaseCreate />
          </div>
        </div>
      </div>
    </div>
  )
}
