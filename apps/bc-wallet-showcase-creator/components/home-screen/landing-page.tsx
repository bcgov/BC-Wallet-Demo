'use client'

import React, { useEffect, useState } from 'react'
import { useDeleteShowcase, useDuplicateShowcase, useShowcases } from '@/hooks/use-showcases'
import { baseUrl } from '@/lib/utils'
import type { Showcase, TenantResponse } from 'bc-wallet-openapi'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { env } from '@/env'

import Header from '../header'
import ButtonOutline from '../ui/button-outline'
import { Card } from '../ui/card'
import { CopyButton } from '../ui/copy-button'
import { DeleteButton } from '../ui/delete-button'
import { OpenButton } from '../ui/external-open-button'
import { toast } from 'sonner'
import { useTenant } from '@/providers/tenant-provider'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { usePresentationCreation } from '@/hooks/use-presentation-creation'
import { useOnboardingCreationStore } from '@/hooks/use-onboarding-store'
import { useQueryClient } from '@tanstack/react-query'

const WALLET_URL = env.NEXT_PUBLIC_WALLET_URL

export const LandingPage = () => {
  const t = useTranslations()
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading } = useShowcases()
  const { mutateAsync: deleteShowcase } = useDeleteShowcase()
  const { tenantId } = useTenant()
  const { mutateAsync: duplicateShowcase } = useDuplicateShowcase()
  const { reset, setScenarioIds,setPersonaIds } = useShowcaseStore()
  const { setIssuerId, setRelayerId } = useHelpersStore()
  const resetIds = usePresentationCreation().reset
  const resetOnboardingIds = useOnboardingCreationStore().reset
  const queryClient = useQueryClient()

  useEffect(() => {
    const fetchTenantConfig = async () => {
      if (tenantId) {
        try {
          const endpoint = `${env.NEXT_PUBLIC_SHOWCASE_API_URL}/tenants/${tenantId}`
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch tenant config for ${tenantId}.`)
          }

          const tenantResponse = (await response.json()) as TenantResponse
          if (tenantResponse.tenant.issuers && tenantResponse.tenant.relyingParties) {
            setIssuerId(tenantResponse.tenant.issuers[0].id)
            setRelayerId(tenantResponse.tenant.relyingParties[0].id)
          }
        } catch (error) {
          console.error('Error fetching tenant config:', error)
        }
      }
    }

    void fetchTenantConfig()
  }, [tenantId, setIssuerId, setRelayerId])

  const handleDeleteShowcase = async (showcaseSlug: string) => {
   await deleteShowcase(showcaseSlug)
    reset()
    setScenarioIds([])
    setPersonaIds([])
    resetIds()
    resetOnboardingIds()
    queryClient.invalidateQueries({ queryKey: ['showcases'] })
  }

  const searchFilter = (showcase: Showcase) => {
    if (searchTerm === '') {
      return true
    }
    return showcase.name.toLowerCase().includes(searchTerm.toLowerCase())
  }

  const handlePreview = (slug: string) => {

    const previewUrl = `${WALLET_URL}/${tenantId}/${slug}`
    window.open(previewUrl, '_blank')
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
    <>
      <Header title={t('home.header_title')} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {isLoading && (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          {t('showcases.loading_label')}
        </div>
      )}

      <section className="mx-auto p-4">
        <div className="grid md:grid-cols-3 gap-6 mt-6 pb-4">
          {(data?.showcases || []).filter(searchFilter).map((showcase: Showcase) => (
            <Card key={showcase.id}>
              <div
                key={showcase.id}
                className="bg-white dark:bg-dark-bg rounded-lg overflow-hidden border border-light-border dark:border-dark-border flex flex-col h-full"
              >
                <div
                  className="relative min-h-[15rem] h-auto flex items-center justify-center bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${
                      showcase?.bannerImage?.id ? `${baseUrl}/${tenantId}/assets/${showcase.bannerImage.id}/file` : '/assets/NavBar/Showcase.jpeg'
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
                            handleDeleteShowcase(showcase.slug)
                          }}
                        />
                        <CopyButton disabled={showcase.status !== 'ACTIVE'} value={`${WALLET_URL}/${tenantId}/${showcase.slug}`} />
                        <OpenButton disabled={showcase.status !== 'ACTIVE'} value={`${WALLET_URL}/${tenantId}/${showcase.slug}`} />
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
                            src={
                              persona.headshotImage?.id
                                ? `${baseUrl}/${tenantId}/assets/${persona.headshotImage.id}/file`
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
                    <ButtonOutline disabled={showcase.status !== 'ACTIVE'} className="w-1/2" onClick={() => handlePreview(showcase.slug)}>
                      {t('action.preview_label')}
                    </ButtonOutline>
                    <ButtonOutline disabled={showcase.status !== 'ACTIVE'} className="w-1/2" onClick={() => handleDuplicateShowcase(showcase.slug)}>
                      {t('action.create_copy_label')}
                    </ButtonOutline>
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
