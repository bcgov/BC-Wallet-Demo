'use client'

import * as React from 'react'

import { NavProjects } from '@/components/nav-projects'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenu,
  SidebarRail,
} from '@/components/ui/sidebar'
import {  GalleryVerticalEnd } from 'lucide-react'

import { NavUser } from './nav-user'
import { Link } from '@/i18n/routing'
import { Separator } from './ui/separator'
import { useTenant } from '@/providers/tenant-provider'
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { tenantId } = useTenant();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href={`/${tenantId}/`} className="flex items-center gap-2">
                <GalleryVerticalEnd className="h-5 w-5" />
                <span className="text-base font-semibold">{tenantId}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <NavProjects />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
