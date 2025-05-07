'use client'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Link, usePathname, useRouter } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { getTenantId, useTenant } from '@/providers/tenant-provider'
import { CreditCard, Home, Map } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function NavProjects() {
  const t = useTranslations('sidebar')
  const pathname = usePathname()
  const { tenantId } = useTenant();

  const projects = [
    {
      name: 'home_label',
      url: `/${tenantId}`,
      icon: Home,
    },
    {
      name: 'showcases_label',
      url: `/${tenantId}/showcases`,
      icon: Map,
    },
    {
      name: 'credential_library_label',
      url: `/${tenantId}/credentials`,
      icon: CreditCard,
    },
  ]

  const router = useRouter()
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {projects.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <Link href={item.url} className={cn(pathname === item.url && 'bg-light-bg dark:bg-dark-bg-secondary')}>
                  <item.icon />
                  <span>{t(item.name)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
