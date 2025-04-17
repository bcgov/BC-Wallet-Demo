import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { convertBase64, baseUrl } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useAssetById, useCreateAsset } from '@/hooks/use-asset'
import Image from 'next/image'
import { AssetResponse } from 'bc-wallet-openapi'
interface LocalFileUploadProps {
  text: string
  element: string
  handleLocalUpdate: (key: string, value: string) => void
  existingAssetId?: string
}

export function LocalFileUpload({ text, element, handleLocalUpdate, existingAssetId }: LocalFileUploadProps) {
  const t = useTranslations()
  const [preview, setPreview] = useState<string | null>(null)
  const { mutateAsync: createAsset } = useCreateAsset()

  const { data: response } = useAssetById(existingAssetId || '') as {
    data?: AssetResponse
    isLoading: boolean
  }

  useEffect(() => {
    if (!existingAssetId) {
      setPreview(null)
    }
  }, [existingAssetId])

  useEffect(() => {
    if (response?.asset?.content) {
      setPreview(response.asset.content)
    }
  }, [response])

  const handleChange = async (newValue: File | null) => {
    if (newValue) {
      try {
        const base64 = await convertBase64(newValue)
        if (typeof base64 === 'string') {
          await createAsset(
            {
              content: base64,
              mediaType: newValue.type,
              fileName: newValue.name,
            },
            {
              onSuccess: (data: unknown) => {
                const response = data as AssetResponse
                setPreview(base64)
                handleLocalUpdate(element, response.asset.id)
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
      handleLocalUpdate(element, '')
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault()
    setPreview(null)
    handleLocalUpdate(element, '')
  }
  return (
    <div className="flex items-center flex-col justify-center w-full">
      <p className="w-full text-start text-foreground font-bold mb-2">{text}</p>

      {preview && (
        <div className="relative w-full">
          <button
            type="button"
            className="rounded p-1 m-2 absolute text-foreground right-0 top-0 text-sm hover:bg-red-400"
            onClick={handleRemove}
          >
            <Trash2 />
          </button>
        </div>
      )}

      <label
        htmlFor={element}
        className="p-3 flex flex-col items-center justify-center w-full h-full bg-light-bg dark:bg-dark-input dark:hover:bg-dark-input-hover rounded-lg cursor-pointer border dark:border-dark-border hover:bg-light-bg"
      >
        <div className="flex flex-col items-center h-full justify-center border rounded-lg border-dashed dark:border-dark-border p-2">
          {existingAssetId ? (
            <Image
              alt={`${text} preview`}
              className="right-auto top-auto p-3 w-3/4"
              src={`${baseUrl}/assets/${existingAssetId}/file`}
              width={300}
              height={100}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          ) : (
            <p className="text-center text-xs text-foreground/50 lowercase">
              <span className="font-bold text-foreground/50">{t('file_upload.click_to_upload_label')}</span>{' '}
              {t('file_upload.drag_to_upload_label')}
            </p>
          )}
        </div>

        <input
          id={element}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => handleChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}