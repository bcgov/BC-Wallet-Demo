'use client'

import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Link, usePathname } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { CreditCard, Home, Map } from 'lucide-react'
import { useTranslations } from 'next-intl'

const projects = [
  {
    name: 'home_label',
    url: '/',
    icon: Home,
  },
  {
    name: 'showcases_label',
    url: '/showcases',
    icon: Map,
  },
  {
    name: 'credential_library_label',
    url: '/credentials',
    icon: CreditCard,
  }
]

export function NavProjects() {
  const t = useTranslations('sidebar')
  const pathname = usePathname()

  return (
    <SidebarGroup>
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
    </SidebarGroup>
  )
}
