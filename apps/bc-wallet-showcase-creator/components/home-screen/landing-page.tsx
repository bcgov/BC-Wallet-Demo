'use client'

import React, { useState } from 'react'

import { useShowcases } from '@/hooks/use-showcases'
import { ensureBase64HasPrefix } from '@/lib/utils'
import type { Showcase } from '@/openapi-types'
import { Share2 } from 'lucide-react'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

import Header from '../header'
import ButtonOutline from '../ui/button-outline'
import { Card } from '../ui/card'
import { CopyButton } from '../ui/copy-button'
import { DeleteButton } from '../ui/delete-button'
import { OpenButton } from '../ui/external-open-button'
import { Input } from '../ui/input'
import { SidebarTrigger } from '../ui/sidebar'

export const LandingPage = () => {
  const t = useTranslations()
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading } = useShowcases()

  const searchFilter = (showcase: Showcase) => {
    if (searchTerm === '') {
      return true
    }
    return showcase.name.toLowerCase().includes(searchTerm.toLowerCase())
  }

  return (
    <>
      <Header title={t('home.header_title')} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* {!isLoading && (
        <div className="container mx-auto px-5 mt-2">
          <div className="flex gap-4 text-sm font-medium">
            {tabs.map((tab, index) => (
              <button
                key={index}
                className={`flex items-center gap-1 px-2 py-1 ${
                  activeTab === tab
                    ? "border-b-2 border-light-blue dark:border-white dark:text-dark-text text-light-blue font-bold cursor-pointer"
                    : "text-gray-800/50 dark:text-gray-200/50"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                <div className="font-bold text-base">{tab}</div>
                <span className="bg-light-bg-secondary dark:dark-bg-secondary text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {index === 0 ? data?.showcases.length : index === 1 ? 1 : 2}
                </span>
              </button>
            ))}
          </div>
        </div>
      )} */}

      {isLoading && (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          {t('showcases.loading_label')}
        </div>
      )}
      <section className="mx-auto p-4">
        <div className="grid md:grid-cols-3 gap-6 mt-6 pb-4">
          {data?.showcases.filter(searchFilter).map((showcase: Showcase) => (
            <Card key={showcase.id}>
              <div
                key={showcase.id}
                className="bg-white dark:bg-dark-bg rounded-lg overflow-hidden border border-light-border dark:border-dark-border flex flex-col h-full"
              >
                <div
                  className="relative min-h-[15rem] h-auto flex items-center justify-center bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${
                      showcase?.bannerImage?.content ? showcase.bannerImage.content : '/assets/NavBar/Showcase.jpeg'
                    }')`,
                  }}
                >
                  <div className="absolute bg-black bottom-0 left-0 right-0 bg-opacity-70 p-3">
                    <p className="text-xs text-gray-300 break-words">
                      {t('showcases.created_by_label', {
                        name: 'Test college',
                      })}
                    </p>
                    <div className="flex justify-between">
                      <h2 className="text-lg font-bold text-white break-words">{showcase?.name}</h2>
                      <div className="flex-shrink-0">
                        <DeleteButton
                          onClick={() => {
                            console.log('delete', showcase.id)
                          }}
                        />
                        <CopyButton value={'http://localhost:3000/digital-trust/showcase/' + showcase.slug} />
                        <OpenButton value={'http://localhost:3000/digital-trust/showcase/' + showcase.slug} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">
                    {t('showcases.description_label')}
                  </h3>
                  <p className="text-light-text dark:text-dark-text text-xs">{showcase?.description}</p>
                  <h3 className="text-sm font-semibold text-light-text dark:text-dark-text mt-2">
                    {t('showcases.description_version')}
                  </h3>
                  <p className="text-light-text dark:text-dark-text text-xs">{'1.0'}</p>
                  <div className="mt-4 flex-grow mb-4">
                    <h4 className="text-sm font-semibold text-light-text dark:text-dark-text">
                      {t('showcases.character_label')}
                    </h4>
                    <div className="mt-2 space-y-3">
                      {showcase?.personas?.map((persona: any) => (
                        <div
                          key={persona.id}
                          className="border-[1px] border-dark-border dark:border-light-border flex items-center gap-3 p-3 rounded-md"
                        >
                          <Image
                            src={ensureBase64HasPrefix(persona.headshotImage?.content) || '/assets/no-image.jpg'}
                            alt={persona.name}
                            width={44}
                            height={44}
                            className="rounded-full w-[44px] h-[44px]"
                          />
                          <div>
                            <p className="text-base text-foreground font-semibold">{persona.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{persona.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-auto">
                    <ButtonOutline className="w-1/2">{t('action.preview_label')}</ButtonOutline>
                    <ButtonOutline className="w-1/2">{t('action.create_copy_label')}</ButtonOutline>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </>
  )
}

export default LandingPage
