import type { Credentials, ShowcaseJSON } from '@/types'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export const Credential = ({
  issuerName,
  credentialName,
  attributeCount,
  index,
  handleClick,
  selectedCredential,
  handleCredentialRemoval,
  showcaseJSON,
}: {
  issuerName: string
  credentialName: string
  attributeCount: number
  index: keyof Credentials
  handleClick: (index: keyof Credentials) => void
  selectedCredential: keyof Credentials | null
  handleCredentialRemoval: () => void
  showcaseJSON: ShowcaseJSON
}) => {
  const t = useTranslations()
  const isSingleCredential = Object.keys(showcaseJSON.personas[0].credentials).length === 1

  return (
    <>
      <div className="flex flex-row">
        <div className="w-full" data-cred-id={index} onClick={(e) => handleClick(index)}>
          <div
            className={`credential  dark:hover:bg-dark-input hover:bg-light-btn-hover hover:cursor-pointer rounded p-3 mt-3 ${
              selectedCredential === index ? 'border-2 border-primary' : 'border-2 border-transparent'
            }`}
          >
            <div className="grid grid-cols-3">
              <div className="col-span-2">
                <div className="credential-issuer-name">
                  <p>{issuerName}</p>
                </div>
                <div className="credential-credential-name">
                  <p>{credentialName}</p>
                </div>
              </div>
              <div className="flex justify-center items-center align-center">
                <p className="border border-black border-solid rounded-lg text-xs py-1 px-2 flex justify-center items-center dark:border-white">
                  {t('credentials.item_attribute_count_label', { attributeCount })}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div
          className={`remove text-xl flex items-center justify-center w-1/5 ${
            isSingleCredential ? 'hidden' : 'trash-button'
          }`}
          onClick={() => selectedCredential !== null && handleCredentialRemoval()}
        >
          <Trash2 className="cursor-pointer" />
        </div>
      </div>
    </>
  )
}
