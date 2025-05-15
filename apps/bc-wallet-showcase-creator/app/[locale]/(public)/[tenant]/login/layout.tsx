import type { PropsWithChildren } from 'react'
import { getTranslations } from 'next-intl/server'
import type { Locale, PageParams } from '@/types'
import { DarkModeToggle } from '@/components/dark-mode-toggle'
import { LanguageSelector } from '@/components/language-selector'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const locale = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  
  return {
    title: t('title'),
    description: t('description'),
  }
}

type Params = PropsWithChildren<{
  params: PageParams
}>

export default async function AuthLayout({ children }: Params) {
  return (
    <div className="flex min-h-svh flex-col items-center bg-background p-6 md:p-10">
      <div className="fixed top-0 w-full p-4 flex justify-end bg-background/80 backdrop-blur-sm z-10">
        <div className="flex gap-2 items-center">
          <LanguageSelector />
          <DarkModeToggle />
        </div>
      </div>

      <div className="flex flex-grow flex-col items-center justify-center gap-6 w-full">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}