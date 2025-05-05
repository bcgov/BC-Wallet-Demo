'use client'

import { useState, useEffect } from 'react'
import { useCreateAsset } from '@/hooks/use-asset'
import { baseUrl, convertBase64 } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AssetResponse } from 'bc-wallet-openapi'
import Image from 'next/image'

export const BannerImageUpload = ({
  text,
  value,
  onChange,
}: {
  text: string
  value?: string
  onChange: (value: string) => void
}) => {
  const t = useTranslations()
  const [preview, setPreview] = useState<string | null>(null)
  const { mutateAsync: createAsset } = useCreateAsset()

  useEffect(() => {
    if (value) {
      setPreview(`${baseUrl}/assets/${value}/file`)
    } else {
      setPreview(null)
    }
  }, [value])

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
                const response = data as AssetResponse
                setPreview(`data:${newValue.type};base64,${base64}`)
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
            <Trash2 className="w-4 h-4" />
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
              className="p-3 w-3/4 object-cover"
              src={preview}
              width={300}
              height={100}
              priority={true}
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
          accept="image/png, image/jpeg"
          className="hidden"
          onChange={(e) => handleChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}
