'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Form } from '@/components/ui/form'
import { useCredentials } from '@/hooks/use-credentials-store' // Use the credentials store
import apiClient from '@/lib/apiService' // Importing the API client
import type { CredentialImportFormData } from '@/schemas/credentialImport'
import { credentialSchema } from '@/schemas/credentialImport' // Adjusted to import the correct schema
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'

import { FormTextInput } from '../text-input'
import ButtonOutline from '../ui/button-outline'
import Accordion from './components/accordion-group'

interface SchemaResponse {
  schemaId: string
  issuerName: string
  // other properties
}

interface CredentialResponse {
  credentialId: string
  schemaId: string
  name: string
  // other properties
}

export const CredentialsImport = () => {
  const t = useTranslations()

  const defaultValues: CredentialImportFormData = {
    credentialId: '',
    schemaId: '',
    icon: '',
    proofRequestCheckbox: false,
    issuanceCheckbox: false,
  }

  const form = useForm<CredentialImportFormData>({
    resolver: zodResolver(credentialSchema),
    defaultValues,
    mode: 'onChange',
  })

  // Fetch schema and credential data when schemaId or credentialId changes

  const onSubmit = (data: CredentialImportFormData) => {
    form.reset()
    // Optionally handle submission (e.g., send data to the backend)
  }

  const handleCancel = () => {
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="my-4 flex flex-col">
        <div className="flex flex-col gap-x-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold ">{t('credentials.import_header_title')}</h3>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-regular text-foreground">{t('credentials.import_header_subtitle')}</p>
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M19 13.5V19.5C19 20.0304 18.7893 20.5391 18.4142 20.9142C18.0391 21.2893 17.5304 21.5 17 21.5H5C4.46957 21.5 3.96086 21.2893 3.58579 20.9142C3.21071 20.5391 3 20.0304 3 19.5V7.5C3 6.96957 3.21071 6.46086 3.58579 6.08579C3.96086 5.71071 4.46957 5.5 5 5.5H11V7.5H5V19.5H17V13.5H19ZM13 3.5V5.5H17.586L9.793 13.293L11.207 14.707L19 6.914V11.5H21V3.5H13Z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-center">
                <a
                  href="https://candyscan.idlab.org/txs/CANDY_PROD/domain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1f2223] text-sm font-bold underline tracking-wide"
                >
                  {t('credentials.link_text')}
                </a>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <FormTextInput
              control={form.control}
              label={t('credentials.credential_id_label')}
              name="credentialId"
              register={form.register}
              error={form.formState.errors.credentialId?.message}
              placeholder={t('credentials.credential_id_placeholder')}
            />

            <FormTextInput
              control={form.control}
              label={t('credentials.schema_id_label')}
              name="schemaId"
              register={form.register}
              error={form.formState.errors.schemaId?.message}
              placeholder={t('credentials.schema_id_placeholder')}
            />
          </div>
          <div className="flex space-x-4">
            <label className="text-sm font-bold" htmlFor="issuanceCheckbox">
              {t('credentials.checkbox_label')}
            </label>
            <div className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...form.register('issuanceCheckbox')}
                className="h-5 w-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
              />
              <span className="text-sm">{t('credentials.first_checkbox_label')}</span>
            </div>

            <div className="flex items-center space-x-2 cursor-pointer ">
              <input
                type="checkbox"
                {...form.register('proofRequestCheckbox')}
                className="h-5 w-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm">{t('credentials.second_checkbox_label')}</span>
            </div>
          </div>
          <div className=" mx-auto ">
            <div className="grid md:grid-cols-1 gap-2">
              <h3 className="text-lg font-bold text-foreground">{t('credentials.import_instructions_title')}</h3>
              {/* Column 1 */}
              <Accordion />
            </div>
          </div>
          <div className="sticky bottom-0 bg-white border-t border-gray-200 dark:border-gray-700 dark:bg-dark-bg p-4 flex justify-end gap-4">
            <ButtonOutline type="button" onClick={handleCancel}>
              {t('action.cancel_label')}
            </ButtonOutline>
            <ButtonOutline type="submit" disabled={!form.formState.isValid}>
              {t('action.create_label')}
            </ButtonOutline>
          </div>{' '}
        </div>
      </form>
    </Form>
  )
}
