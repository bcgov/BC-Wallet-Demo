import type { UseFormReturn } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'

import { FormTextInput } from '@/components/text-input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CredentialAttributeType } from '@/openapi-types'
import { CredentialAttributeTypeEnum } from '@/openapi-types'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

type FormData = {
  attributes: {
    name: string
    value: string
    type: 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'DATE'
  }[]
}

interface SchemaAttributesProps {
  mode: 'create' | 'view'
  form: UseFormReturn<FormData>
  attributes?: CredentialAttributeType[]
}

export const CredentialAttributes = ({ mode, form, attributes }: SchemaAttributesProps) => {
  const t = useTranslations()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'attributes',
  })

  if (mode === 'view' && attributes) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-x-2 mx-4 py-3 border-b border-gray-200">
          <h3 className="text-md font-semibold text-foreground">{t('credentials.attributes_label')}</h3>
        </div>
        <Table className="w-full gap-x-2 px-4 py-3">
          <TableHeader className="bg-gray-100 dark:bg-dark-bg-tertiary border-b border-gray-200 uppercase dark:border-dark-border">
            <TableRow>
              <TableHead>{t('credentials.attribute_name_label')}</TableHead>
              <TableHead>{t('credentials.attribute_value_label')}</TableHead>
              <TableHead>{t('credentials.attribute_type_label')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border">
            {attributes.map((attr, index) => (
              <TableRow key={attr.name || index}>
                <TableCell className="font-semibold">{attr.name}</TableCell>
                <TableCell className="font-semibold">{attr.value}</TableCell>
                <TableCell>{attr.type || 'string'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <label className="text-lg font-bold">{t('credentials.attributes_label')}</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              name: '',
              value: '',
              type: CredentialAttributeTypeEnum.options[0],
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('credentials.attributes_add_attribute_label')}
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-4">
              <FormTextInput
                control={form.control}
                name={`attributes.${index}.name`}
                label={t('credentials.attribute_name_label')}
                register={form.register}
                error={form.formState.errors?.attributes?.[index]?.name?.message}
                placeholder={t('credentials.attribute_name_placeholder')}
              />
            </div>
            <div className="col-span-4">
              <FormTextInput
                control={form.control}
                name={`attributes.${index}.value`}
                label={t('credentials.attribute_value_label')}
                register={form.register}
                error={form.formState.errors?.attributes?.[index]?.value?.message}
                placeholder={t('credentials.attribute_value_placeholder')}
              />
            </div>
            <div className="col-span-3">
              <label className="text-md font-bold mb-2 block">{t('credentials.attribute_type_label')}</label>
              <Select
                onValueChange={(value) => {
                  form.setValue(`attributes.${index}.type`, value as typeof CredentialAttributeTypeEnum._type)
                }}
                defaultValue={field.type || 'STRING'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CredentialAttributeTypeEnum.options.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
