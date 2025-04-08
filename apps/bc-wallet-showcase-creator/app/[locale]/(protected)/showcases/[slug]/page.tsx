import MyShowcaseMain from '@/components/showcases-screen'
import { setRequestLocale } from 'next-intl/server'

type PageParams = Promise<{ slug: string; locale: string }>

export default async function Showcases({ params }: { params: PageParams }) {
  const { slug, locale } = await params
  setRequestLocale(locale)

  return (
    <div className={`flex bg-light-bg  text-light-text dark:bg-dark-bg dark:text-dark-text`}>
      <MyShowcaseMain slug={slug} />
    </div>
  )
}
