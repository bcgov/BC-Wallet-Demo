import MyShowcaseMain from '@/components/showcases-screen'
import type { PageParams } from '@/types'
import { setRequestLocale } from 'next-intl/server'

export default async function CharacterPageMain({ params }: { params: PageParams }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div>
      <MyShowcaseMain slug="example-name" />
    </div>
  )
}
