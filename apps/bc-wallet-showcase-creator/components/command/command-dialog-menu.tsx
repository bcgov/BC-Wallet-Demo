'use client'

import * as React from 'react'
import { Calculator, Calendar, Eraser, Key, LogOut, Plus, Smile, Sun, User } from 'lucide-react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { signOut } from 'next-auth/react'
import { useRouter } from '@/i18n/routing'
import { useTheme } from 'next-themes'
import { usePersonaAdapter } from '@/hooks/use-persona-adapter'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { toast } from 'sonner'
import { useTenant } from '@/providers/tenant-provider'



export function CommandDialogMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { setSelectedPersonaIds } = usePersonaAdapter()
  // const { setTenantId, tenantId } = useHelpersStore()

  const { tenantId } = useTenant();

  const menuItems = [
    {
      icon: <User />,
      label: 'Developer',
      href: `/${tenantId}/developer`,
    },
    {
      icon: <Key />,
      label: 'Credentials',
      href: `/${tenantId}credentials`,
    },
    {
      icon: <Plus />,
      label: 'Create showcase',
      href: `/${tenantId}/showcases/create`,
    },
  ]

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
    setOpen((open) => !open)
  }

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const navigateTo = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  const clearPersonaState = () => {
    setSelectedPersonaIds([])
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar />
            <span>Create credential</span>
          </CommandItem>

          <div onClick={() => console.log('Disabled')}>
            <CommandItem>
              <Smile />
              <span>Create tenant</span>
            </CommandItem>
          </div>
          <CommandItem>
            <Calculator />
            <span>Create credential schema</span>
          </CommandItem>

          <div onClick={() => clearPersonaState()}>
            <CommandItem>
              <Eraser />
              <span>Clear personas state</span>
            </CommandItem>
          </div>

          <div onClick={() => toggleDarkMode()}>
            <CommandItem>
              <Sun />
              <span>Toggle theme</span>
            </CommandItem>
          </div>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          {menuItems.map((item) => (
            <div key={item.label} onClick={() => navigateTo(item.href)}>
              <CommandItem>
                {item.icon}
                <span>{item.label}</span>
              </CommandItem>
            </div>
          ))}

          <CommandSeparator />
        </CommandGroup>
        <CommandGroup heading="Auth">
          <div onClick={() => signOut()}>
            <CommandItem>
              <LogOut />
              <span>Logout</span>
            </CommandItem>
          </div>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
