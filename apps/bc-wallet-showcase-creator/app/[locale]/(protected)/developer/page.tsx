import type { PageParams } from '@/types'
import { setRequestLocale } from 'next-intl/server'
import { User } from './components/user'
import { IssuanceState } from './components/issuance-state'
import { PresentationState } from './components/presentation-state'
import { Helpers } from './components/helpers-state'

export default async function Credentials({ params }: { params: PageParams }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="flex text-light-text dark:bg-dark-bg dark:text-dark-text flex-col h-full w-full">
      <div className="flex flex-col gap-4 p-4">
        <User />
        <Helpers />
        <IssuanceState />
        <PresentationState />
      </div>
    </div>
  )
}
