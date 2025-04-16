import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

import { DarkModeToggle } from './dark-mode-toggle'
import { JSONUploadButton } from './json-uploader'
import { LanguageSelector } from './language-selector'
import { NavBarButton } from './navbar-button'
import { SaveButton } from './save-button'

export const NavBar = () => {
  const t = useTranslations()

  return (
    <div className="w-full px-4 py-2 dark:text-dark-text">
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Left Column */}
        <div className="flex items-center gap-4 gap-x-6">
          <DarkModeToggle />
          <LanguageSelector />
        </div>

        {/* Center Column */}
        <div className="flex justify-center">
          <div className="flex gap-4 px-6 py-2 shadow-md button-dark bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
            <NavBarButton title={t('navigation.character_label')} src="/assets/NavBar/character.svg" page="/" />
            <NavBarButton
              title={t('navigation.credentials_label')}
              src="/assets/NavBar/credentials.svg"
              page="/credentials"
            />
            <NavBarButton title={t('navigation.onboarding_label')} src="/assets/NavBar/setup.svg" page="/onboarding" />
            <NavBarButton title={t('navigation.scenario_label')} src="/assets/NavBar/scenario.svg" page="/scenarios" />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-2">
            <JSONUploadButton />
            <Link
              href="/"
              className="inline-flex items-center gap-x-1.5 rounded-md border bg-light-bg dark:bg-dark-b dark:hover:bg-dark-btn-hover px-2.5 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
            >
              {t('action.reset_label')}
            </Link>
            <SaveButton />
          </div>
        </div>
      </div>
    </div>
  )
}
