'use client'

// import { useRouter } from "next/navigation";
import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

export default function TabsComponent({ slug }: { slug: string }) {
  const t = useTranslations()
  const pathname = usePathname()

  const tabs = [
    { label: 'General', path: `/showcases/${slug}` },
    // { label: t('navigation.character_label'), path: `/showcases/${slug}` },
    { label: t('navigation.character_label'), path: `/showcases/${slug}/characters` },
    { label: t('navigation.onboarding_label'), path: `/showcases/${slug}/onboarding` },
    { label: t('navigation.scenario_label'), path: `/showcases/${slug}/scenarios` },
    { label: t('navigation.publish_label'), path: `/showcases/${slug}/publish` },
  ]

  return (
    <div>
      {tabs.map((tab: { label: string; path: string }) => (
        <Link href={tab.path} key={tab.label}>
          <button
            key={tab.path}
            // onClick={() => router.push(tab.path)}
            className={`py-1 px-2 inline-block w-fit ${
              tab.path === pathname
                ? 'border-b-2 border-light-blue dark:border-white dark:text-dark-text text-light-text font-bold cursor-pointer'
                : 'text-gray-400 dark:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        </Link>
      ))}
    </div>
  )
}
