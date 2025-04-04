import { CreateScenariosStepsScreen } from '@/components/scenario-screen/choose-step-screen'
import { CreateScenariosScreen } from '@/components/scenario-screen/scenario-creation'
import TabsComponent from '@/components/Tabs-component'
import { useTranslations } from 'next-intl'

export default function CreateScenariosPage() {
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
              <h2 className="text-base font-bold text-foreground">{t('scenario.header_title')}</h2>
              <p className="w-full text-xs">{t('scenario.header_subtitle')}</p>
            </div>
            <CreateScenariosScreen />
          </div>
          <div className="w-2/3 bg-white dark:bg-dark-bg-secondary border shadow-md rounded-md flex flex-col">
            <CreateScenariosStepsScreen />
          </div>
        </div>
      </div>
    </div>
  )
}
