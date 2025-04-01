import type { PropsWithChildren } from 'react'
import { getTranslations } from 'next-intl/server'
import type { Locale, PageParams } from '@/types'

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
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
