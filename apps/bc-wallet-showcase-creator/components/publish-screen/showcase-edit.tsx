'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useFormDirtyStore } from '@/hooks/use-form-dirty-store'

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
import { showcaseToShowcaseRequest } from '@/lib/parsers'
import { useTenant } from '@/providers/tenant-provider'

export const ShowcaseEdit = ({ slug }: { slug: string }) => {
  const t = useTranslations()
  const router = useRouter()
  const { mutateAsync: updateShowcase } = useUpdateShowcase(slug)
  const { setSelectedPersonaIds, setScenarioIds, setCurrentShowcaseSlug, setShowcase } = useShowcaseStore()
  // const { tenantId, setTenantId } = useHelpersStore()
  const [isLoading, setIsLoading] = useState(true)
  const { tenantId, setTenantId } = useTenant();
  const { setDirty } = useFormDirtyStore();

  const { data: showcaseData, isLoading: isShowcaseLoading } = useShowcase(slug)

  const form = useForm<ShowcaseRequest>({
    resolver: zodResolver(showcaseRequestFormData),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      completionMessage: '',
      status: 'PENDING',
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
      setShowcase(showcaseToShowcaseRequest(showcase))
      setSelectedPersonaIds(showcase.personas?.map((p) => (typeof p === 'string' ? p : p.id)) || [])
      setScenarioIds(showcase.scenarios?.map((s) => (typeof s === 'string' ? s : s.id)) || [])
    }
  }, [
    showcaseData,
    isShowcaseLoading,
    form,
    tenantId,
    setShowcase,
    setCurrentShowcaseSlug,
    setSelectedPersonaIds,
  ])

  useEffect(() => {
    setDirty(form.formState.isDirty);
  }, [form.formState.isDirty, setDirty]);

  const onSubmit = async (formData: ShowcaseRequest) => {
    try {
      await updateShowcase(formData, {
        onSuccess: (data: ShowcaseResponse) => {
          if (data.showcase) {
            toast.success('Showcase updated successfully')
            form.reset(formData) // Reset form state after successful update
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

  const handleProceed = () => {
    if (form.formState.isDirty) {
      toast.warning(t('character.save_changes_warning'))
      return
    }
    router.push(`/${tenantId}/showcases/${slug}/characters`)
  }

  if (isLoading || isShowcaseLoading) {
    return <div className="p-6">{t('showcases.loading_showcase_data_label')}</div>
  }

  return (
    <div className="flex flex-col p-6">
      <StepHeader icon={<Monitor strokeWidth={3} />} title={'Edit showcase details'} showDropdown={false} />

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
              isMandatory={true}
              placeholder="Enter showcase name"
            />
            <FormTextArea
              control={form.control}
              label="Showcase Description"
              name="description"
              register={form.register}
              error={form.formState.errors.description?.message}
              isMandatory={true}
              placeholder="Enter showcase description"
            />

            <div className="space-y-2">
              <BannerImageUpload
                text={'Showcase Image'}
                value={form.watch('bannerImage')}
                isMandatory={true}
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

            <FormTextArea
              control={form.control}
              label="Showcase Completion Details"
              name="completionMessage"
              register={form.register}
              error={form.formState.errors.completionMessage?.message}
              placeholder="Add details here that should appear in the pop-up box that appears at completion of your showcase."
            />

            {/* <div className="flex items-center space-x-2 mt-2">
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
            </div> */}

            
          </div>

          <div className="mt-auto pt-4 border-t flex justify-end gap-3">
            {/* <ButtonOutline onClick={handleCancel}>{t('action.cancel_label')}</ButtonOutline> */}

            <div className="flex gap-3">
              <ButtonOutline disabled={!form.formState.isValid || !form.formState.isDirty} type="submit">
                {t('action.save_label')}
              </ButtonOutline>

              {slug && (
                <ButtonOutline
                  onClick={handleProceed}
                  disabled={form.formState.isDirty}
                >
                  {'Proceed to Character'}
                </ButtonOutline>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
