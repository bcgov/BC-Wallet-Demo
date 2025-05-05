'use client'

import { useState } from 'react'

import ButtonOutline from '@/components/ui/button-outline'
import { Card } from '@/components/ui/card'
import { useCreateShowcase, useDeleteShowcase, useDuplicateShowcase, useShowcases } from '@/hooks/use-showcases'
import { Link } from '@/i18n/routing'
import { baseUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Persona, Showcase } from 'bc-wallet-openapi'
import { CopyButton } from '../ui/copy-button'
import { DeleteButton } from '../ui/delete-button'
import { OpenButton } from '../ui/external-open-button'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Header from '../header'
import { env } from '@/env'
import { toast } from 'sonner'

const WALLET_URL = env.NEXT_PUBLIC_WALLET_URL

export const ShowcaseList = () => {
  const t = useTranslations()
  const { data, isLoading } = useShowcases()
  const { mutateAsync: deleteShowcase } = useDeleteShowcase()
  const { mutateAsync: duplicateShowcase } = useDuplicateShowcase()
  const tabs = [
    { label: t('showcases.header_tab_overview'), status: 'ALL' },
    { label: t('showcases.header_tab_draft'), status: 'PENDING' },
    { label: t('showcases.header_tab_under_review'), status: 'UNDER_REVIEW' },
    { label: t('showcases.header_tab_published'), status: 'ACTIVE' },
  ]

  const [activeTab, setActiveTab] = useState(tabs[0])
  const [searchTerm, setSearchTerm] = useState('')

  const searchFilter = (showcase: Showcase) => {
    if (searchTerm === '') {
      return true
    }
    return showcase.name.toLowerCase().includes(searchTerm.toLowerCase())
  }

  const handleDuplicateShowcase = async (showcaseSlug: string) => {
    const newShowcase = await duplicateShowcase(showcaseSlug, {
      onSuccess: (data: unknown) => {
        console.log('Showcase Created:', data)
        toast.success('Showcase Duplicated')
      },
      onError: (error: unknown) => {
        toast.error('Error duplicating showcase: ' + error)
      },
    })
    console.log('newShowcase', newShowcase)
  }

  return (
    <div className="flex-1 bg-light-bg dark:bg-dark-bg dark:text-dark-text text-light-text min-h-[calc(100vh-40px)]">
      <Header
        title={t('showcases.header_title')}
        showSearch={true}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        buttonLabel={t('showcases.create_new_showcase_label')}
        buttonLink="/showcases/create"
      />

      {!isLoading && (
        <div className="mx-auto px-5 mt-2">
          <div className="flex gap-4 text-sm font-medium">
            {tabs.map((tab, index) => {
              const showcaseCount =
                tab.status === tabs[0].status
                  ? data?.showcases?.length || 0
                  : data?.showcases?.filter((showcase) => showcase.status === tab.status).length || 0

              return (
                <button
                  key={index}
                  className={`flex items-center gap-1 px-2 py-1 ${
                    activeTab.status === tab.status
                      ? 'border-b-2 border-light-blue dark:border-white dark:text-dark-text text-light-blue font-bold cursor-pointer'
                      : 'text-gray-800/50 dark:text-gray-200/50'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  <div className="font-bold text-base">{tab.label}</div>
                  <span className="bg-light-bg-secondary dark:dark-bg-secondary text-gray-600 text-xs px-2 py-0.5 rounded-full">
                    {showcaseCount}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          {t('showcases.loading_label')}
        </div>
      )}

      <section className="mx-auto p-4">
        <div className="grid md:grid-cols-3 gap-6 mt-6 pb-4">
          {data?.showcases
            ?.filter(searchFilter)
            .filter((showcase) => activeTab.status === tabs[0].status || showcase.status === activeTab.status)
            .reverse()
            .map((showcase: Showcase) => (
              <Card key={showcase.id}>
                <div
                  key={showcase.id}
                  className="bg-white dark:bg-dark-bg rounded-lg overflow-hidden border border-light-border dark:border-dark-border flex flex-col h-full"
                >
                  <div
                    className="relative min-h-[15rem] h-auto flex items-center justify-center bg-cover bg-center"
                    style={{
                      backgroundImage: `url('${
                        showcase?.bannerImage?.id
                          ? `${baseUrl}/assets/${showcase.bannerImage.id}/file`
                          : '/assets/NavBar/Showcase.jpeg'
                      }')`,
                    }}
                  >
                    <div
                      className={cn(
                        'left-4 right-0 top-4 py-2 rounded w-1/4 absolute',
                        showcase.status == 'ACTIVE' ? 'bg-yellow-500' : 'bg-dark-grey',
                      )}
                    >
                      <p className={cn('text-center', showcase.status == 'ACTIVE' ? 'text-black' : 'text-white')}>
                        {showcase.status}
                      </p>
                    </div>
                    <div className="absolute bg-black bottom-0 left-0 right-0 bg-opacity-70 p-3"></div>
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
                              deleteShowcase(showcase.slug)
                            }}
                          />

                          <CopyButton value={`${WALLET_URL}/${showcase.slug}`} />
                          <OpenButton value={`${WALLET_URL}/${showcase.slug}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">
                      {t('showcases.description_label')}
                    </h3>
                    <p className="text-light-text dark:text-dark-text text-xs">{showcase.description}</p>
                    <h3 className="text-sm font-semibold text-light-text dark:text-dark-text mt-2">
                      {t('showcases.description_version')}
                    </h3>
                    <p className="text-light-text dark:text-dark-text text-xs">1.0</p>

                    <div className="mt-4 flex-grow mb-4">
                      <h4 className="text-sm font-semibold text-light-text dark:text-dark-text">
                        {t('showcases.character_label')}
                      </h4>
                      <div className="mt-2 space-y-3">
                        {showcase?.personas?.map((persona: Persona) => (
                          <div
                            key={persona.id}
                            className="border-[1px] border-dark-border dark:border-light-border flex items-center gap-3 p-3 rounded-md"
                          >
                            <Image
                              src={
                                persona.headshotImage?.id
                                  ? `${baseUrl}/assets/${persona.headshotImage.id}/file`
                                  : '/assets/no-image.jpg'
                              }
                              alt={persona.headshotImage?.description || 'Character headshot'}
                              width={44}
                              height={44}
                              className="rounded-full w-[44px] h-[44px] object-cover"
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
                      <Link className="w-1/2" href={`/showcases/${showcase.slug}`}>
                        <ButtonOutline
                          className="w-full"
                        >
                          {t('action.edit_label')}
                        </ButtonOutline>
                      </Link>
                      <ButtonOutline onClick={() => handleDuplicateShowcase(showcase.slug)} className="w-1/2">
                        {t('action.create_copy_label')}
                      </ButtonOutline>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </section>

      {/* <DeleteModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDelete={() => {
            setIsModalOpen(false);
          }}
          header="Edit Published Showcase?"
          description="You are about to edit a published showcase. If you instead wish to make a copy, click <b>Cancel</b> below and then select <b>Create A Copy</b> under the showcase card"
          subDescription="If you proceed with editing, a <b>Draft version</b> will be created. This Draft will remain unpublished until an Admin approves your changes. <b>Until then, the current published showcase will stay active.</b>"
          cancelText="CANCEL"
          deleteText="PROCEED WITH EDITING"
        /> */}
    </div>
  )
}
