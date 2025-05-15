'use client'

import { PublishEdit } from '@/components/publish-screen/publish-edit'
import { PublishInfo } from '@/components/publish-screen/publish-info'
import { usePersonas } from '@/hooks/use-personas'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useTranslations } from 'next-intl'
import { Persona } from 'bc-wallet-openapi'

export function PublishInfoPage() {
  const t = useTranslations()
  const { selectedPersonaIds } = useShowcaseStore()
  const { data: personas } = usePersonas()

  const personasToDisplay = (personas?.personas || []).filter((persona) => selectedPersonaIds.includes(persona.id))

  return (
    <div className="flex gap-4 p-4 h-fit-content">
    <div className="w-1/3 bg-background border shadow-md rounded-md flex flex-col">
      <div className="p-4 border-b shadow">
        <h2 className="text-base font-bold text-foreground">{t('showcases.publish_info_title')}</h2>
        <p className="w-full text-xs">{t('showcases.publish_info_subtitle')}</p>
      </div>
      <PublishInfo characters={personasToDisplay as Partial<Persona>[]} credentials={[]} />
    </div>
    <div className="w-2/3 bg-background border shadow-md rounded-md flex flex-col">
      <PublishEdit />
    </div>
  </div>
  )
}
