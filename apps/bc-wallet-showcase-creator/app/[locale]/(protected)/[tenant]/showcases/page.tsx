import React from 'react'

import { ShowcaseList } from '@/components/showcases-screen/showcase-list'
import type { PageParams } from '@/types'
import { setRequestLocale } from 'next-intl/server'

export default async function Showcases({ params }: { params: PageParams }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="flex bg-light-bg  text-light-text dark:bg-dark-bg dark:text-dark-text">
      <ShowcaseList />
    </div>
  )
}
