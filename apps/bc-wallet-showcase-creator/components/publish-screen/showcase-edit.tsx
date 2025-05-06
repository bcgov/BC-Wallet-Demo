'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from '@/i18n/routing'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FormTextArea, FormTextInput } from '../text-input'
import { Form } from '../ui/form'
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'
import {  ShowcaseRequest, ShowcaseResponse, ShowcaseStatus } from 'bc-wallet-openapi'

import { toast } from 'sonner'
import { useShowcase, useUpdateShowcase } from '@/hooks/use-showcases'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { showcaseRequestFormData } from '@/schemas/showcase'
import { BannerImageUpload } from './showcase-image-upload'

export const ShowcaseEdit = ({ slug }: { slug: string }) => {
  const t = useTranslations()
  const router = useRouter()
  const { mutateAsync: updateShowcase } = useUpdateShowcase(slug)
  const { setShowcaseFromResponse } = useShowcaseStore()
  const { setSelectedPersonaIds, setScenarioIds, setCurrentShowcaseSlug } = useShowcaseStore()
  const { tenantId, setTenantId } = useHelpersStore()
  const [isLoading, setIsLoading] = useState(true)

  const { data: showcaseData, isLoading: isShowcaseLoading } = useShowcase(slug)

  const form = useForm<ShowcaseRequest>({
    resolver: zodResolver(showcaseRequestFormData),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      completionMessage: '',
      status: 'ACTIVE',
      hidden: false,
      scenarios: [],
      personas: [],
      tenantId: '',
      bannerImage: '',
    },
  })

  useEffect(() => {
    setTenantId(showcaseData?.showcase?.tenantId || '')
  }, [showcaseData, setTenantId])

  useEffect(() => {
    if (showcaseData && !isShowcaseLoading) {
      const { showcase } = showcaseData

      if (!showcase) {
        return
      }

      const directBannerId =
        typeof showcase.bannerImage === 'string'
          ? showcase.bannerImage
          : showcase.bannerImage && typeof showcase.bannerImage === 'object' && 'id' in showcase.bannerImage
            ? showcase.bannerImage.id
            : ''

      form.reset({
        name: showcase.name,
        description: showcase.description,
        completionMessage: showcase.completionMessage || '',
        status: showcase.status,
        hidden: showcase.hidden,
        scenarios: showcase.scenarios?.map((s) => (typeof s === 'string' ? s : s.id)) || [],
        personas: showcase.personas?.map((p) => (typeof p === 'string' ? p : p.id)) || [],
        tenantId: showcase.tenantId || '',
        bannerImage: directBannerId,
      })

      setIsLoading(false)
      setTenantId(showcase.tenantId || '')
      setCurrentShowcaseSlug(showcase.slug)
      setShowcaseFromResponse(showcase)
      setSelectedPersonaIds(showcase.personas?.map((p) => (typeof p === 'string' ? p : p.id)) || [])
      setScenarioIds(showcase.scenarios?.map((s) => (typeof s === 'string' ? s : s.id)) || [])
    }
  }, [
    showcaseData,
    isShowcaseLoading,
    form,
    tenantId,
    setShowcaseFromResponse,
    setCurrentShowcaseSlug,
    setSelectedPersonaIds,
  ])

  const onSubmit = async (formData: ShowcaseRequest) => {
    try {
      await updateShowcase(formData, {
        onSuccess: (data: ShowcaseResponse) => {
          if (data.showcase) {
            toast.success('Showcase updated successfully')
            router.push(`/showcases/${slug}`)
          } else {
            toast.error('Error updating showcase')
          }
        },
        onError: (error) => {
          console.error('Update error:', error)
          toast.error('Error updating showcase')
        },
      })
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Error updating showcase')
    }
  }

  const handleCancel = () => router.back()

  if (isLoading || isShowcaseLoading) {
    return <div className="p-6">{t('showcases.loading_showcase_data_label')}</div>
  }

  return (
    <div className="flex flex-col p-6">
      <StepHeader icon={<Monitor strokeWidth={3} />} title={'Edit Showcase'} showDropdown={false} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow space-y-6">
          <div className="space-y-6 flex-grow">
            <FormTextInput
              control={form.control}
              label="Showcase Name"
              name="name"
              disabled={true}
              register={form.register}
              error={form.formState.errors.name?.message}
              placeholder="Enter showcase name"
            />
            <FormTextArea
              control={form.control}
              label="Showcase Description"
              name="description"
              register={form.register}
              error={form.formState.errors.description?.message}
              placeholder="Enter showcase description"
            />
            <FormTextArea
              control={form.control}
              label="Showcase Completion Details"
              name="completionMessage"
              register={form.register}
              error={form.formState.errors.completionMessage?.message}
              placeholder="Add details here that should appear in the pop-up box that appears at completion of your showcase."
            />

            <div className="flex items-center space-x-2 mt-2">
              <input type="checkbox" id="hidden" {...form.register('hidden')} className="w-4 h-4" />
              <label htmlFor="hidden" className="text-md font-medium text-foreground">
                Hide from public view
              </label>
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-md font-bold text-foreground">Status</label>
              <select
                {...form.register('status')}
                className="w-full p-2 border rounded-md bg-light-bg dark:bg-dark-input"
              >
                <option value={ShowcaseStatus.Pending}>Pending</option>
                <option value={ShowcaseStatus.Active}>Active</option>
                <option value={ShowcaseStatus.Archived}>Archived</option>
              </select>
            </div>

            <div className="space-y-2">
              <BannerImageUpload
                text={t('onboarding.icon_label')}
                value={form.watch('bannerImage')}
                onChange={(value) => {
                  console.log('value form edit', value)
                  form.setValue('bannerImage', value, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }}
              />
              {form.formState.errors.bannerImage?.message && (
                <p className="text-md w-full text-start text-foreground mb-3 text-red-500 text-sm">
                  {form.formState.errors.bannerImage?.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t flex justify-end gap-3">
            <ButtonOutline onClick={handleCancel}>{t('action.cancel_label')}</ButtonOutline>

            <div className="flex gap-3">
              <ButtonOutline disabled={!form.formState.isValid || !form.formState.isDirty} type="submit">
                {t('action.save_label')}
              </ButtonOutline>

              {slug && (
                <ButtonOutline
                  onClick={(e) => {
                    e.preventDefault()
                    router.push(`/showcases/${slug}/characters`)
                  }}
                >
                  {t('action.next_label')}
                </ButtonOutline>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
