import { EditStepScreen } from '@/components/scenario-screen/edit-step-screen'
import { ScenarioScreen } from '@/components/scenario-screen/scenario-screen'
import TabsComponent from '@/components/Tabs-component'
import type { PageParams } from '@/types'
import { Pencil } from 'lucide-react'
import { setRequestLocale, getTranslations } from 'next-intl/server'

export default async function Scenario({ params }: { params: PageParams }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <div className="flex bg-light-bg dark:bg-dark-bg flex-col h-full w-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center px-6 py-2 mt-4">
          {/* Left Header Section */}
          <div className="flex items-center space-x-4">
            <span className="text-light-text dark:text-dark-text font-medium text-sm">Showcase1 </span>
            <Pencil size={16} />
            <span className="rounded-[5px] bg-gray-500 px-3 py-1 min-w-24 text-center min-h-4 text-sm text-white">
              {t('showcases.header_tab_draft')}
            </span>
          </div>
          {/* Tabs Section */}
          <div className="flex space-x-1 text-lg font-semibold justify-start">
            <TabsComponent slug="example-name" />
          </div>
          <button className="text-gray-500 hover:text-gray-700"></button>
        </div>
        <div className="flex gap-4 p-4 h-fit-content">
          {/* Left Section - Character Selection with Header */}
          <div className="w-1/3 bg-[white] dark:bg-dark-bg-secondary border shadow-md rounded-md flex flex-col">
            <div className="p-4 border-b shadow">
              <h2 className="text-base font-bold text-foreground">{t('scenario.header_title')}</h2>
              <p className="w-full text-xs">{t('scenario.header_subtitle')}</p>
            </div>
            <ScenarioScreen />
          </div>
          {/* Right Section - Character Details with Header */}
          <div className="w-2/3 bg-white dark:bg-dark-bg-secondary border shadow-md rounded-md flex flex-col">
            <EditStepScreen />
          </div>
        </div>
      </div>
    </div>
  )
}
