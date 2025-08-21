'use client'

import { useEffect, useState } from 'react'

import ButtonOutline from '@/components/ui/button-outline'
import { Card } from '@/components/ui/card'
import { useCreateShowcase, useDeleteShowcase, useDuplicateShowcase, useShowcases } from '@/hooks/use-showcases'
import { Link, useRouter } from '@/i18n/routing'
import { baseUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ShowcaseStatus, TenantResponse, type Persona, type Showcase, type ShowcaseRequest } from 'bc-wallet-openapi'
import { CopyButton } from '../ui/copy-button'
import { DeleteButton } from '../ui/delete-button'
import { OpenButton } from '../ui/external-open-button'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Header from '../header'
import { env } from '@/env'
import { getTenantId } from '@/providers/tenant-provider'
import { toast } from 'sonner'
import apiClient from '@/lib/apiService'
import { showcaseToShowcaseRequest } from '@/lib/parsers'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { useQueryClient } from '@tanstack/react-query'
import { useCredentialDefinitions } from '@/hooks/use-credentials'
import { usePresentationCreation } from '@/hooks/use-presentation-creation'
import { useOnboardingCreationStore } from '@/hooks/use-onboarding-store'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import DeleteModal from '../delete-modal'

const WALLET_URL = env.NEXT_PUBLIC_WALLET_URL

export const ShowcaseList = () => {
  const t = useTranslations()
  const { data, isLoading } = useShowcases()
  const { mutateAsync: deleteShowcase } = useDeleteShowcase()
  const { reset, setScenarioIds,setPersonaIds } = useShowcaseStore()
  const { mutateAsync: duplicateShowcase } = useDuplicateShowcase()
  const { data: credentials } = useCredentialDefinitions()
  const resetIds = usePresentationCreation().reset
  const resetOnboardingIds = useOnboardingCreationStore().reset
  const { issuerId, relayerId } = useHelpersStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showcaseToDelete, setShowcaseToDelete] = useState<string | null>(null)

  const tabs = [
    { label: t('showcases.header_tab_overview'), status: 'ALL' },
    { label: t('showcases.header_tab_draft'), status: 'PENDING' },
    { label: t('showcases.header_tab_under_review'), status: 'UNDER_REVIEW' },
    { label: t('showcases.header_tab_published'), status: 'ACTIVE' },
  ]

  const [activeTab, setActiveTab] = useState(tabs[0])
  const [searchTerm, setSearchTerm] = useState('')

  const tenantId = getTenantId()

  const searchFilter = (showcase: Showcase) => {
    if (searchTerm === '') {
      return true
    }
    return showcase.name.toLowerCase().includes(searchTerm.toLowerCase())
  }

    const { setIssuerId, setRelayerId } = useHelpersStore()
  
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
    setIsModalOpen(false)
    queryClient.invalidateQueries({ queryKey: ['showcases'] })
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

  const openModal = (slug: string) => {
    setShowcaseToDelete(slug)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setShowcaseToDelete(null)
    setIsModalOpen(false)
  }

  const confirmDelete = () => {
    if (showcaseToDelete) {
      handleDeleteShowcase(showcaseToDelete)
    }
  }

  const UpdateShowcaseStatus = async(showcase: Showcase) => {
    
    const showcaseRequest = showcaseToShowcaseRequest(showcase);
    const updatedShowcase = {
      ...showcaseRequest,
      status: ShowcaseStatus.Pending
    };
  
    const response = await apiClient.put(`/showcases/${showcase.slug}`, updatedShowcase)

    if(response) {
      queryClient.invalidateQueries({ queryKey: ['showcase', showcase.slug] })
      queryClient.invalidateQueries({ queryKey: ['showcases'] })
      router.push(`/${tenantId}/showcases/${showcase.slug}`)
    }
  }

  const HandleShowcaseCreate = () => {
    reset()
    setScenarioIds([])
    setPersonaIds([])
    resetIds()
    resetOnboardingIds()
    if (!issuerId || !relayerId || credentials?.credentialDefinitions?.length === 0) {
      toast.error('Please create a credential before creating a showcase.', { duration: 4000 })
      return
    } else {
      router.push(`/${tenantId}/showcases/create`)
    }
  }
  
  return (
    <div className="flex-1 bg-light-bg dark:bg-dark-bg dark:text-dark-text text-light-text min-h-[calc(100vh-40px)]">
      <Header
        title={t('showcases.header_title')}
        showSearch={true}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        buttonLabel={t('showcases.create_new_showcase_label')}
        buttonLink={HandleShowcaseCreate}
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
                          ? `${baseUrl}/${tenantId}/assets/${showcase.bannerImage.id}/file`
                          : '/assets/NavBar/Showcase.jpeg'
                      }')`,
                    }}
                  >
                    <div
                      className={cn(
                        'left-4 right-0 top-4 py-2 rounded w-fit px-2 absolute',
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
                          name: tenantId,
                        })}
                      </p>
                      <div className="flex justify-between">
                        <h2 className="text-lg font-bold text-white break-words">{showcase?.name}</h2>
                        <div className="flex-shrink-0">
                          <DeleteButton
                            onClick={() => {
                              openModal(showcase.slug)
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
                      <Link className="w-1/2" href={`/${tenantId}/showcases/${showcase.slug}`}>
                        <ButtonOutline
                          onClick={() => UpdateShowcaseStatus(showcase)}
                          className="w-full"
                        >
                          {t('action.edit_label')}
                        </ButtonOutline>
                      </Link>
                      <ButtonOutline disabled={showcase.status !== 'ACTIVE'} onClick={() => handleDuplicateShowcase(showcase.slug)} className="w-1/2">
                        {t('action.create_copy_label')}
                      </ButtonOutline>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </section>

        <DeleteModal
          isOpen={isModalOpen}
          onClose={() => closeModal()}
          onDelete={() => confirmDelete()}
          header="Are you sure you want to delete this showcase?"
          description="Are you sure you want to delete this showcase?"
          subDescription="<b>This action cannot be undone.</b>"
          cancelText="CANCEL"
          deleteText="DELETE"
          isLoading={isLoading}
        />
    </div>
  )
}
