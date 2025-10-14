'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFormDirtyStore } from '@/hooks/use-form-dirty-store'

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
import { useCreateShowcase, useUpdateShowcase } from '@/hooks/use-showcases'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { showcaseRequestFormData } from '@/schemas/showcase'
import { usePresentationCreation } from '@/hooks/use-presentation-creation'
import { useOnboardingCreation } from '@/hooks/use-onboarding-creation'
import { BannerImageUpload } from './showcase-image-upload'
import { useTenant } from '@/providers/tenant-provider'

export const ShowcaseCreate = () => {
  const t = useTranslations()
  const router = useRouter()
  const { mutateAsync: createShowcase, isPending: isCreating } = useCreateShowcase()
  const { showcase, setShowcase, reset: resetCreateShowcase, setCurrentShowcaseSlug, currentShowcaseSlug } =
    useShowcaseStore()
  const { mutateAsync: updateShowcase, isPending: isUpdating } = useUpdateShowcase(currentShowcaseSlug)
  const { reset: resetOnboardingCreation } = useOnboardingCreation()
  // const { tenantId } = useHelpersStore()
  const { tenantId } = useTenant();
  const { setDirty } = useFormDirtyStore();

  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [Slug, setSlug] = useState<string | null>(null);

  const handleImageUploadError = (error: string) => {
    setImageUploadError(error);
  };

  const isSubmitting = isCreating || isUpdating

  

  const form = useForm<ShowcaseRequest>({
    resolver: zodResolver(showcaseRequestFormData),
    mode: 'onChange',
    defaultValues: {
      ...showcase,
      tenantId: tenantId,
    },
  })

  const isFormReady =
  form.formState.isValid &&
  (
    Object.keys(form.formState.dirtyFields).length > 0 ||
    form.watch('bannerImage')
  )

  const onSubmit = async (formData: ShowcaseRequest, shouldNavigate = false) => {
    const payload: ShowcaseRequest = {
      name: formData.name,
      description: formData.description,
      completionMessage: formData.completionMessage,
      status: 'PENDING',
      hidden: formData.hidden,
      scenarios: formData.scenarios,
      personas: formData.personas,
      tenantId: formData.tenantId,
      bannerImage: formData.bannerImage,
    }

    const handleSuccess = (apiResponse?: { showcase?: { slug?: string } }) => {
      if (currentShowcaseSlug) {
        setShowcase(payload)
        toast.success('Showcase updated successfully')
        form.reset(payload) // Reset form state after successful update
        setDirty(false) // Mark form as clean after save
        if (shouldNavigate) {
          router.push(`/${tenantId}/showcases/create/characters`)
        }
      } else if (apiResponse?.showcase?.slug) {
        setSlug(apiResponse.showcase.slug)
        setCurrentShowcaseSlug(apiResponse.showcase.slug)
        setShowcase(payload)
        toast.success('Showcase created successfully')
        form.reset(payload) // Reset form state after successful creation
        setDirty(false) // Mark form as clean after save
        if (shouldNavigate) {
          router.push(`/${tenantId}/showcases/create/characters`)
        }
      } else {
        toast.error('Error creating showcase: No slug returned')
      }
    }

    const handleError = () => {
      toast.error(`Error ${currentShowcaseSlug ? 'updating' : 'creating'} showcase`)
    }

    if (currentShowcaseSlug) {
      updateShowcase(payload, {
        onSuccess: () => handleSuccess(),
        onError: handleError,
      })
    } else {
      createShowcase(payload, {
        onSuccess: handleSuccess,
        onError: handleError,
      })
    }
  }

  useEffect(() => {
    setDirty(form.formState.isDirty);
  }, [form.formState.isDirty, setDirty]);

  const handleProceed = () => {
    if (form.formState.isDirty) {
      toast.warning(t('character.save_changes_warning'))
      return
    }
    if (currentShowcaseSlug) {
      router.push(`/${tenantId}/showcases/create/characters`)
    } else {
      router.push(`/${tenantId}/showcases/create/characters`)
    }
  }

  return (
    <div className="flex flex-col p-6">
      <StepHeader icon={<Monitor strokeWidth={3} />} title={'Enter showcase details'} showDropdown={false} />

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col flex-grow space-y-6">
          <div className="space-y-6 flex-grow">
            <FormTextInput
              control={form.control}
              label="Showcase Name"
              name="name"
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
              isMandatory={true}
              error={form.formState.errors.description?.message}
              placeholder="Enter showcase description"
            />
            <div className="space-y-2">
              <BannerImageUpload
                text={'Showcase Image'}
                value={form.watch('bannerImage')}
                maxSize={2 * 1024 * 1024} // 2MB limit
                onImageUploadError={handleImageUploadError}
                isMandatory={true}
                onChange={(value) => {
                  console.log('value form create', value)
                  form.setValue('bannerImage', value, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                  setImageUploadError(null); // Clear error on change
                }}
              />
              {imageUploadError && (
                <p className="text-md w-full text-start text-foreground mb-3 text-red-500 text-sm">
                  {imageUploadError}
                </p>
              )}
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
              placeholder="This text will appear in a pop-up box for the end-user on the final page of your showcase."
            />
          </div>

          <div className="mt-auto pt-4 border-t flex justify-end gap-3">
            <ButtonOutline
              onClick={form.handleSubmit((data) => onSubmit(data, false))}
              disabled={!isFormReady || isSubmitting || !form.formState.isDirty}
            >
              {t('action.save_label')}
            </ButtonOutline>

            <div className="flex gap-3">
              <ButtonOutline
                disabled={isSubmitting || form.formState.isDirty}
                onClick={handleProceed}
              >
                {'Proceed to Character'}
              </ButtonOutline>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
