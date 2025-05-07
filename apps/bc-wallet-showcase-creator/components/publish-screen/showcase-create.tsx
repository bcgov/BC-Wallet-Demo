'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from '@/i18n/routing'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FormTextArea, FormTextInput } from '../text-input'
import { Form } from '../ui/form'
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'
import { ShowcaseRequest } from 'bc-wallet-openapi'

import { toast } from 'sonner'
import { useCreateShowcase } from '@/hooks/use-showcases'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { showcaseRequestFormData } from '@/schemas/showcase'
import { usePresentationCreation } from '@/hooks/use-presentation-creation'
import { useOnboardingCreation } from '@/hooks/use-onboarding-creation'
import { BannerImageUpload } from './showcase-image-upload'

export const ShowcaseCreate = () => {
  const t = useTranslations()
  const router = useRouter()
  const { mutateAsync: createShowcase } = useCreateShowcase()
  const { setShowcase, reset: resetCreateShowcase, setCurrentShowcaseSlug } = useShowcaseStore()
  const { reset: resetPresentationCreation } = usePresentationCreation()
  const { reset: resetOnboardingCreation } = useOnboardingCreation()
  const { tenantId } = useHelpersStore()

  useEffect(() => {
    resetCreateShowcase()
    resetPresentationCreation()
    resetOnboardingCreation()
  }, [])

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
      tenantId: tenantId,
      bannerImage: '',
    },
  })

  const onSubmit = async (formData: ShowcaseRequest) => {
    createShowcase(formData, {
      onSuccess: (data) => {
        if (data.showcase?.slug) {
          setCurrentShowcaseSlug(data.showcase.slug)
          setShowcase({ ...formData, tenantId, bannerImage: formData.bannerImage })
          toast.success('Showcase created successfully')
          router.push(`/showcases/create/characters`)
        } else {
          toast.error('Error creating showcase')
        }
      },
      onError: () => {
        toast.error('Error creating showcase')
      },
    })
  }

  const handleCancel = () => form.reset()

  return (
    <div className="flex flex-col p-6">
      <StepHeader icon={<Monitor strokeWidth={3} />} title={'Create your showcase'} showDropdown={false} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow space-y-6">
          <div className="space-y-6 flex-grow">
            <FormTextInput
              control={form.control}
              label="Showcase Name"
              name="name"
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
            <div className="space-y-2">
              <BannerImageUpload
                text={t('onboarding.icon_label')}
                value={form.watch('bannerImage')}
                onChange={(value) => {
                  console.log('value form create', value)
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
          </div>

          <div className="mt-auto pt-4 border-t flex justify-end gap-3">
            <ButtonOutline onClick={handleCancel}>{t('action.cancel_label')}</ButtonOutline>

            <div className="flex gap-3">
              <ButtonOutline disabled={!form.formState.isValid || !form.formState.isDirty} type="submit">
                {t('action.next_label')}
              </ButtonOutline>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
