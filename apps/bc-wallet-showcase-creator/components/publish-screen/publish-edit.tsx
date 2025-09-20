'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useRouter } from '@/i18n/routing'
import { baseUrl, convertBase64 } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FormTextArea, FormTextInput } from '../text-input'
import { Form } from '../ui/form'
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'
import { toast } from 'sonner'
import Image from 'next/image'
import { ShowcaseRequest, ShowcaseStatus, AssetResponse, IssuanceScenario, PresentationScenario, Showcase } from 'bc-wallet-openapi'
import { z } from 'zod'

import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { useCreateAsset } from '@/hooks/use-asset'
import { useShowcaseAdapter } from '@/hooks/use-showcase-adapter'
import { useTenant } from '@/providers/tenant-provider'
import { usePresentationCreation } from '@/hooks/use-presentation-creation'
import { useOnboardingCreationStore } from '@/hooks/use-onboarding-store'
import { useShowcase } from '@/hooks/use-showcases'

const BannerImageUpload = ({
  text,
  value,
  onChange,
  maxSize,
  onImageUploadError,
  isMandatory
}: {
  text: string
  value?: string
  onChange: (value: string) => void
  maxSize?: number // Max size in bytes
  onImageUploadError?: (error: string) => void
  isMandatory?: boolean
}) => {
  const t = useTranslations()
  const { mutateAsync: createAsset } = useCreateAsset()
  const { tenantId } = useTenant();

  const handleChange = async (newValue: File | null) => {
    if (newValue) {
      if (maxSize && newValue.size > maxSize) {
        onImageUploadError?.(t('file_upload.file_size_exceeded'));
        return;
      }
      try {
        const base64 = await convertBase64(newValue)
        if (typeof base64 === 'string') {
          await createAsset(
            {
              content: base64,
              mediaType: newValue.type,
            },
            {
              onSuccess: (data: unknown) => {
                const response = data as AssetResponse
                onChange(response.asset.id)
              },
              onError: (error) => {
                console.error('Error creating asset:', error)
              },
            },
          )
        }
      } catch (error) {
        console.error('Error converting file:', error)
      }
    } else {
      onChange('')
    }
  }

  // Simply render the component with minimal logic
  return (
    <div className="flex items-center flex-col justify-center">
      <p className="text-md w-full text-start font-bold text-foreground mb-3">{text}{isMandatory ? <span className="text-red-500">*</span> : null}</p>

      <div className="w-full">
        {value && (
          <div className="relative mb-4 flex justify-center">
            <div className="relative w-60 h-60">
              <button
                className="bg-red-500 rounded p-1 absolute z-10 text-white right-0 top-0 text-sm hover:bg-red-400"
                onClick={(e) => {
                  e.preventDefault()
                  onChange('')
                }}
              >
                <Trash2 size={16} />
              </button>
              <Image
                alt="banner preview"
                src={`${baseUrl}/${tenantId}/assets/${value}/file`}
                width={240}
                height={240}
                className="rounded-lg shadow object-cover"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        )}

        {!value && (
          <label
            htmlFor="bannerImage"
            className="p-3 flex flex-col items-center justify-center w-full h-60 bg-light-bg dark:bg-dark-input dark:hover:bg-dark-input-hover rounded-lg cursor-pointer border dark:border-dark-border hover:bg-light-bg"
          >
            <div className="flex flex-col items-center h-full justify-center border rounded-lg border-dashed dark:border-dark-border p-2">
              <p className="text-center text-xs lowercase">
                <span className="font-bold">{t('file_upload.click_to_upload_label')}</span>{' '}
                {t('file_upload.drag_to_upload_label')}
              </p>
            </div>
          </label>
        )}

        <input
          id="bannerImage"
          type="file"
          accept="image/png, image/jpeg, image/svg+xml"
          className="hidden"
          onChange={(e) => handleChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  )
}

const ShowcaseRequestSchema = z.object({
  name: z.string().min(1, 'Showcase name is required'),
  description: z.string().min(1, 'Showcase description is required').max(200, 'Showcase description cannot exceed 200 characters'),
  bannerImage: z.string().min(1, 'Banner image is required'),
  completionMessage: z.string().optional(),
  status: z.nativeEnum(ShowcaseStatus),
  hidden: z.boolean(),
  tenantId: z.string().min(1),
})

export const PublishEdit = () => {
  const t = useTranslations()
  const { showcase, reset, setScenarioIds,setPersonaIds } = useShowcaseStore()
  const router = useRouter()
  const { saveShowcase } = useShowcaseAdapter()
  const { personas } = useOnboardingAdapter()
  const { tenantId } = useTenant();
  const resetIds = usePresentationCreation().reset
  const resetOnboardingIds = useOnboardingCreationStore().reset
  //@ts-expect-error: Slug is present
  let Slug = showcase?.slug
  const { data: showcaseDataFull, isLoading: isShowcaseLoading } = useShowcase(Slug || '')

  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [FullShowcaseData,setFullShowcaseData] = useState<any | null>(null) 
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  
  const handleImageUploadError = (error: string) => {
    setImageUploadError(error);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false)
    setErrorMessages([])
  }

  const form = useForm<ShowcaseRequest>({
    resolver: zodResolver(ShowcaseRequestSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'ACTIVE',
      hidden: false,
      scenarios: [],
      personas: [],
      tenantId,
      bannerImage: '',
      completionMessage: '',
    },
    mode: 'onChange',
  })

  useEffect(() => {
    const bannerImageValue = showcase.bannerImage
    const bannerImageId =
      typeof bannerImageValue === 'object' && bannerImageValue !== null
        ? (bannerImageValue as { id:string }).id
        : bannerImageValue

    form.reset({
      ...showcase,
      name: showcase.name || '',
      description: showcase.description || '',
      personas: personas.map((persona) => persona.id) || [],
      scenarios: showcase.scenarios || [],
      status: 'ACTIVE',
      tenantId,
      bannerImage: bannerImageId || '',
    })
  }, [form.reset, showcase, tenantId, JSON.stringify(personas)])

  useEffect(() => {
    setFullShowcaseData(showcaseDataFull?.showcase)
  },[showcase,Slug])
  

  const onSubmit = async () => {
  const data = form.getValues()
  if (!FullShowcaseData) return

  const missing: string[] = []
  const personas = FullShowcaseData.personas || []
  const scenarios = FullShowcaseData.scenarios || []


  if (personas.length < 1) {
    missing.push('At least 1 persona is required')
  }


  const issuanceScenarios = scenarios.filter((s:IssuanceScenario) => s.type === 'ISSUANCE')
  const presentationScenarios = scenarios.filter((s:PresentationScenario) => s.type === 'PRESENTATION')
  const requiredScenarios = personas.length * 2 // 1 ISSUANCE + 1 PRESENTATION per persona

  if (scenarios.length < requiredScenarios) {
    missing.push(`At least ${requiredScenarios} scenarios required (currently ${scenarios.length})`)
  }

  if (issuanceScenarios.length < personas.length) {
    missing.push(`At least ${personas.length} issuance scenario(s) required (currently ${issuanceScenarios.length})`)
  }

  if (presentationScenarios.length < personas.length) {
    missing.push(`At least ${personas.length} presentation scenario(s) required (currently ${presentationScenarios.length})`)
  }


  issuanceScenarios.forEach((scenario: IssuanceScenario) => {
    if ((scenario.steps || []).length < 6) {
      missing.push(`Issuance scenario "${scenario.name}" must have at least 6 steps (currently ${(scenario.steps || []).length})`)
    }


    scenario.steps?.forEach((step) => {
      if (step.type === 'SERVICE') {
        step.actions?.forEach((action) => {
          if (action.actionType === 'ACCEPT_CREDENTIAL') {
            if (!('credentialDefinitionId' in action) || !action.credentialDefinitionId || action.credentialDefinitionId.trim() === '') {
              missing.push(
                `Step "${step.title}" in onboarding "${scenario.name}" must have a valid credentialDefinitionId for ACCEPT_CREDENTIAL action`
              )
            }
          }
        })
      }
    })
  })

  

  presentationScenarios.forEach((scenario: PresentationScenario) => {
    if ((scenario.steps || []).length < 3) {
      missing.push(`Presentation scenario "${scenario.name}" must have at least 3 steps (currently ${(scenario.steps || []).length})`)
    }

    scenario.steps?.forEach((step) => {
      if (step.type === 'SERVICE') {
        step.actions?.forEach((action) => {
          //@ts-expect-error : proof request exists
          const proofRequest = action?.proofRequest
          if (!proofRequest) {
            missing.push(`Step "${step.title}" in scenario "${scenario.name}" must have a proofRequest`)
          } else {
            const hasAttributes = Object.keys(proofRequest.attributes || {}).length > 0
            const hasPredicates = Object.keys(proofRequest.predicates || {}).length > 0
            if (!hasAttributes && !hasPredicates) {
              missing.push(`ProofRequest in step "${step.title}" of scenario "${scenario.name}" must contain at least one attribute or predicate`)
            }
          }
        })
      }
    })
  })
  console.log('missing',missing);
  if (missing.length > 0) {
    setErrorMessages(missing)
    setShowErrorModal(true)
    return
  }

  await saveShowcase(data)
  toast.success('Showcase created successfully')
  reset()
  setScenarioIds([])
  setPersonaIds([])
  resetIds()
  resetOnboardingIds()
  router.push(`/${tenantId}/showcases`)
  }

  const handleCancel = () => {
    form.reset()
    reset()
  }

  return (
    <div className="flex flex-col min-h-screen p-6">
      <StepHeader icon={<Monitor strokeWidth={3} />} showDelete={false} title={'Publish your showcase'} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow space-y-6">
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
              error={form.formState.errors.description?.message}
              isMandatory={true}
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
            <div className="space-y-2">
              <BannerImageUpload
                text={t('onboarding.icon_label')}
                value={form.watch('bannerImage')}
                maxSize={2 * 1024 * 1024} // 2MB limit
                onImageUploadError={handleImageUploadError}
                isMandatory={true}
                onChange={(value) => {
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
              {form.formState.errors.bannerImage && (
                <p className="text-md w-full text-start text-foreground mb-3 text-red-500 text-sm">
                  {form.formState.errors.bannerImage.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t flex justify-end">
            {/* <div>
              <ButtonOutline onClick={handleCancel}>{t('action.cancel_label')}</ButtonOutline>
            </div> */}
            <div className="flex gap-3">
              <ConfirmationDialog
                title="Publish Showcase"
                content={<>
                  {t('showcase.modal_description2')}
                </>
                }
                buttonLabel={t('showcase.button_label')}
                onSubmit={onSubmit}
                disabled={!form.formState.isValid}
              />
            </div>
          </div>
        </form>
      </Form>
{
  showErrorModal && (
    <>
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            {'Please correct the following issues to proceed:'}
          </h2>
        </div>
        <div className="py-4">
          <ul className="list-disc pl-5 text-red-500">
            {errorMessages.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <button
            type="button"
            onClick={closeErrorModal}
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {'Close'}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
    </div>
  )
}
