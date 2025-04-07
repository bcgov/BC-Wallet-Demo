'use client'

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { LogOut } from 'lucide-react'

import { signOut } from "next-auth/react"

import { DarkModeToggle } from './dark-mode-toggle'
import { LanguageSelector } from './language-selector'
import { Separator } from './ui/separator'

export function NavUser() {
  const { state } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex flex-row gap-2">
          {state !== 'collapsed' && <LanguageSelector />}
          <DarkModeToggle />
        </div>
        <Separator className="my-2" />
        <SidebarMenuButton asChild>
          <p>
            <LogOut />
            <span className="ml-2" onClick={() => signOut()}>Log Out</span>
          </p>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
