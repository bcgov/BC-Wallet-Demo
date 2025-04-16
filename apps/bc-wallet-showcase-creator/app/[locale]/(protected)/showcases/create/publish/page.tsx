'use client'

import { PublishEdit } from '@/components/publish-screen/publish-edit'
import { PublishInfo } from '@/components/publish-screen/publish-info'
import TabsComponent from '@/components/Tabs-component'
import { usePersonas } from '@/hooks/use-personas'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { Persona, CredentialDefinition } from 'bc-wallet-openapi'
import { useTranslations } from 'next-intl'

export default function CreateOnboardingPage() {
  const t = useTranslations()
  const { displayShowcase } = useShowcaseStore()
  const { selectedPersonaIds } = useShowcaseStore()
  const { data: personas } = usePersonas()

  const personasToDisplay = personas?.personas?.filter((persona) => selectedPersonaIds.includes(persona.id))

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
              <h2 className="text-base font-bold text-foreground">{t('showcases.publish_info_title')}</h2>
              <p className="w-full text-xs text-foreground/80">{t('showcases.publish_info_subtitle')}</p>
            </div>
            <PublishInfo characters={personasToDisplay as Partial<Persona>[]} credentials={displayShowcase.credentialDefinitions as Partial<CredentialDefinition>[]} />
          </div>
          <div className="w-2/3 bg-white dark:bg-dark-bg-secondary border shadow-md rounded-md flex flex-col">
            <PublishEdit />
          </div>
        </div>
      </div>
    </div>
  )
}
