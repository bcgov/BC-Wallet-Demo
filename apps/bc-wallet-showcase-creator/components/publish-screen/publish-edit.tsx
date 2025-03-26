'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useCreateAsset } from '@/hooks/use-asset'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { Link, useRouter } from '@/i18n/routing'
import { convertBase64 } from '@/lib/utils'
import type { AssetResponseType, ShowcaseRequestType } from '@/openapi-types'
import { ShowcaseRequest } from '@/openapi-types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor, X } from 'lucide-react'
import { Trash2 } from 'lucide-react'
import { useTranslations } from "next-intl";
import { FormTextArea, FormTextInput } from "../text-input";
import { Form } from "../ui/form";
import StepHeader from '../step-header'
import ButtonOutline from '../ui/button-outline'

import { toast } from 'sonner'
import Image from 'next/image'

import { Button } from '../ui/button'

const BannerImageUpload = ({
  text,
  value,
  onChange,
}: {
  text: string
  value?: string
  onChange: (value: string) => void
}) => {
  const t = useTranslations()
  const [preview, setPreview] = useState<string | null>(value || null)
  const { mutateAsync: createAsset } = useCreateAsset()

  const handleChange = async (newValue: File | null) => {
    if (newValue) {
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
                const response = data as AssetResponseType
                setPreview(base64)
                onChange(response.asset.id)
              },
              onError: (error) => {
                console.error('Error creating asset:', error)
              },
            }
          )
        }
      } catch (error) {
        console.error('Error converting file:', error)
      }
    } else {
      setPreview(null)
      onChange('')
    }
  }

  return (
    <div className="flex items-center flex-col justify-center">
      <p className="text-md w-full text-start font-bold text-foreground mb-3">{text}</p>

      {preview && (
        <div className="relative w-full">
          <button
            className="bg-red-500 rounded p-1 m-2 absolute text-black right-0 top-0 text-sm hover:bg-red-400"
            onClick={(e) => {
              e.preventDefault()
              void handleChange(null)
            }}
          >
            <Trash2 />
          </button>
        </div>
      )}
      <label
        htmlFor="bannerImage"
        className="p-3 flex flex-col items-center justify-center w-full h-full bg-light-bg dark:bg-dark-input dark:hover:bg-dark-input-hover rounded-lg cursor-pointer border dark:border-dark-border hover:bg-light-bg"
      >
        <div className="flex flex-col items-center h-[240px] justify-center border rounded-lg border-dashed dark:border-dark-border p-2">
          {preview ? (
            <Image
              alt="preview"
              className="p-3 w-3/4"
              src={preview}
              width={300}
              height={100}
              style={{ width: '90%', height: '90%' }}
            />
          ) : (
            <p className="text-center text-xs lowercase">
              <span className="font-bold">{t('file_upload.click_to_upload_label')}</span>{' '}
              {t('file_upload.drag_to_upload_label')}
            </p>
          )}
        </div>
        <input
          id="bannerImage"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}

export const PublishEdit = () => {
  const t = useTranslations()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { showcase, reset } = useShowcaseStore()
  const router = useRouter()
  const { saveShowcase } = useOnboardingAdapter()

  const form = useForm<ShowcaseRequestType>({
    resolver: zodResolver(ShowcaseRequest),
    mode: 'all',
    defaultValues: {
      name: '',
      description: '',
      status: 'PENDING',
      hidden: false,
      scenarios: [],
      credentialDefinitions: [],
      personas: [],
    },
  })

  useEffect(() => {
    form.reset({
      ...showcase,
      name: showcase.name || '',
      description: showcase.description || '',
      credentialDefinitions: showcase.credentialDefinitions || ['86a96d6d-91c9-4357-984d-1f6b162fdfae'],
      personas: showcase.personas || [],
      status: 'PENDING',
    })
  }, [form, showcase])

  const onSubmit = async () => {
    const data = form.getValues()
    await saveShowcase(data)
    toast.success('Showcase created successfully')
    reset()
    setIsModalOpen(false)
    router.push('/showcases')
  }

  const handleCancel = () => {
    form.reset()
    reset()
  }

  return (
    <div className="flex flex-col min-h-screen p-6">
      <StepHeader icon={<Monitor strokeWidth={3} />} title={'Publish your showcase'} />

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
                onChange={(value) =>
                  form.setValue('bannerImage', value, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>
          </div>

          <div className="mt-auto pt-4 border-t flex justify-between">
            <div>
              <ButtonOutline onClick={handleCancel}>{t('action.cancel_label')}</ButtonOutline>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                disabled={!form.formState.isValid || !form.formState.isDirty}
                onClick={(e) => {
                  e.preventDefault()
                  setIsModalOpen(true)
                }}
                className="px-6 bg-yellow-500 py-2 rounded text-gray-700 font-bold hover:bg-yellow-400 dark:bg-yellow-500 dark:hover:bg-yellow-600"
              >
                {'PUBLISH FOR REVIEW'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className=" flex flex-col justify-between bg-white p-4 rounded shadow-lg max-w-[40%] text-center">
            <div>
              <div className="flex items-center justify-between border-b border-gray-300 pb-4">
                <h3 className="text-lg font-semibold flex gap-2 items-center">{'Submit for Review?'}</h3>
                <X onClick={() => setIsModalOpen(false)} size={22} className="cursor-pointer ml-4" />
              </div>
              <div className="py-4">
                <p className="mt-2 text-gray-600 text-start">
                  {"Once submitted, you won't be able to make further edits until the review is complete."}
                </p>

                <p className="text-start font-base font-bold">{'Do you want to proceed?'}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t pt-3 border-gray-300">
              <button onClick={() => setIsModalOpen(false)} type="button" className="px-4 py-2 text-gray-700 rounded">
                {t('action.cancel_label')}
              </button>

              <ButtonOutline
                type="submit"
                className="bg-yellow-500 border-light-yellow hover:bg-yellow-500"
                onClick={() => {
                  onSubmit()
                }}
              >
                {'CONFIRM & SUBMIT FOR REVIEW'}
              </ButtonOutline>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
