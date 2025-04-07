import { CredentialsPage } from '@/components/credentials/credentials-page'
import type { PageParams } from '@/types'
import { setRequestLocale } from 'next-intl/server'

export default async function Credentials({ params }: { params: PageParams }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="flex text-light-text dark:bg-dark-bg dark:text-dark-text flex-col h-full w-full">
      <CredentialsPage />
    </div>
  )
}
