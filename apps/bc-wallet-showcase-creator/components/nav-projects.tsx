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
import { CreditCard, Home, Map, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { hasRole } from '@/auth'

export function NavProjects() {
  const t = useTranslations('sidebar')
  const pathname = usePathname()
  const { tenantId } = useTenant()
  const { data: session } = useSession()

  // Check if user has admin role
  const isAdmin = session?.user?.roles 
    ? hasRole(session.user.roles, 'admin')
    : false

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

  // Admin-only navigation items
  const adminProjects = [
    {
      name: 'admin_tenants_label',
      url: `/admin/tenants`,
      icon: Settings,
      adminOnly: true,
    },
  ]

  const router = useRouter()

  // Combine regular and admin projects
  const allProjects = isAdmin 
    ? [...projects, ...adminProjects]
    : projects

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {allProjects.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <Link href={item.url} className={cn(pathname === item.url && 'bg-[#e5e5e5] dark:bg-dark-bg-secondary')}>
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
