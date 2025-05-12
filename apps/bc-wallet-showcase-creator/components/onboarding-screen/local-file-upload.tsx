import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { convertBase64, baseUrl } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { AssetResponse } from 'bc-wallet-openapi'
import { useAssetById, useCreateAsset } from '@/hooks/use-asset'
import Image from 'next/image'
import { getTenantId } from '@/providers/tenant-provider'

interface LocalFileUploadProps {
  text: string
  element: string
  handleLocalUpdate: (key: string, value: string) => void
  existingAssetId?: string
}

export function LocalFileUpload({ text, element, handleLocalUpdate, existingAssetId }: LocalFileUploadProps) {
  const t = useTranslations()
  const [preview, setPreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const { mutateAsync: createAsset } = useCreateAsset()
  const tenantId = getTenantId()

  const { data: response } = useAssetById(existingAssetId || '') as {
    data?: AssetResponse
    isLoading: boolean
  }

  const getDirectAssetId = (): string => {
    if (!existingAssetId) return '';
    
    if (typeof existingAssetId === 'string') {
      return existingAssetId;
    }
    
    if (typeof existingAssetId === 'object' && existingAssetId !== null && 'id' in existingAssetId) {
      return (existingAssetId as { id: string }).id;
    }
    
    return '';
  };
  
  const directAssetId = getDirectAssetId();

  useEffect(() => {
    if (!directAssetId) {
      setPreview(null);
      setImageError(false);
    } 
  }, [directAssetId, element]);

  useEffect(() => {
    if (response?.asset?.content) {
      setPreview(response.asset.content);
      setImageError(false);
    }
  }, [response, element]);

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
                
                setPreview(base64);
                setImageError(false);
                handleLocalUpdate(element, response.asset.id);
              },
              onError: (error) => {
                console.error(`Error creating asset for ${element}:`, error);
                setImageError(true);
              },
            },
          )
        }
      } catch (error) {
        console.error(`Error converting file for ${element}:`, error);
        setImageError(true);
      }
    } else {
      setPreview(null);
      setImageError(false);
      handleLocalUpdate(element, '');
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    setPreview(null);
    setImageError(false);
    handleLocalUpdate(element, '');
  }

  const getImageUrl = () => {
    if (!directAssetId) return '';
    return `${baseUrl}/${tenantId}/assets/${directAssetId}/file`;
  };
  
  return (
    <div className="flex items-center flex-col justify-center w-full">
      <p className="w-full text-start text-foreground font-bold mb-2">{text}</p>

      {(preview || directAssetId) && (
        <div className="relative w-full">
          <button
            type="button"
            className="bg-red-500 rounded p-1 m-2 absolute text-white right-0 top-0 text-sm hover:bg-red-400"
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
          {directAssetId ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                alt={`${text} preview`}
                className="right-auto top-auto p-3 w-3/4 object-cover"
                src={getImageUrl()}
                width={300}
                height={100}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                unoptimized={true}
                onError={() => {
                  
                  setImageError(true);
                }}
              />
              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-100/50 text-red-500">
                  Failed to load image
                </div>
              )}
            </div>
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