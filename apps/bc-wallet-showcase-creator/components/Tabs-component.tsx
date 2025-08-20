'use client'

import { useShowcase } from '@/hooks/use-showcases'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { Link, usePathname } from '@/i18n/routing'
import { useTenant } from '@/providers/tenant-provider'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

export default function TabsComponent({ slug }: { slug: string }) {
  const t = useTranslations()
  const pathname = usePathname()
  const { tenantId } = useTenant()
  const { showcase, setShowcase } = useShowcaseStore()
  const { data: showcaseData } = useShowcase(slug, { enabled: slug !== 'create' })

  useEffect(() => {
    if (showcaseData?.showcase) {
      //@ts-ignore
      setShowcase(showcaseData.showcase)
    }
  }, [showcaseData, setShowcase])

  const tabs = [
    { label: t('navigation.general_label'), path: `/${tenantId}/showcases/${slug}` },
    {
      label: t('navigation.character_label'),
      path: `/${tenantId}/showcases/${slug}/characters`,
      disabled: !showcase.name,
    },
    {
      label: t('navigation.onboarding_label'),
      path: `/${tenantId}/showcases/${slug}/onboarding`,
      disabled: showcase?.personas?.length == 0,
    },
    {
      label: t('navigation.scenario_label'),
      path: `/${tenantId}/showcases/${slug}/scenarios`,
      disabled: showcase.scenarios?.length == 0,
    },
    {
      label: t('navigation.publish_label'),
      path: `/${tenantId}/showcases/${slug}/publish`,
      disabled: (showcase.scenarios?.length ?? 0) <= 1 || (showcase.personas?.length ?? 0) === 0,
    },
  ]

  return (
    <div>
      {tabs.map((tab: { label: string; path: string; disabled?: boolean }) => (
        <Link href={tab.path} key={tab.label}>
          <button
            key={tab.path}
            disabled={tab.disabled}
            className={`py-1 px-2 inline-block w-fit ${
              tab.path === pathname
                ? 'border-b-2 border-light-blue dark:border-white dark:text-dark-text text-light-text font-bold cursor-pointer'
                : 'text-gray-400 dark:text-gray-200'
            } ${tab.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {tab.label}
          </button>
        </Link>
      ))}
    </div>
  )
}
