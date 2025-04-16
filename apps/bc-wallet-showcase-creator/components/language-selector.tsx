'use client'

import React, { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Locale } from '@/i18n/routing'
import { usePathname, useRouter } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useParams } from 'next/navigation'

const languages = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
]

export const LanguageSelector = () => {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const locale = useLocale()
  const params = useParams()

  function onSelectChange(value: Locale) {
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { pathname, params },
        { locale: value }
      )
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-48 justify-between ">
          {languages.find((language) => language.value === locale)?.label}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {languages.map((language) => (
                <CommandItem
                  key={language.value}
                  onSelect={() => onSelectChange(language.value as Locale)}
                  defaultChecked={locale === language.value}
                >
                  <Check className={cn('mr-2 h-4 w-4', locale === language.value ? 'opacity-100' : 'opacity-0')} />
                  {language.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
