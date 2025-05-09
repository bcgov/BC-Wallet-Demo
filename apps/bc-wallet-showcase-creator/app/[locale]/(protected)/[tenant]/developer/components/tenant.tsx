'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useTenants } from '@/hooks/use-tenants'
import { useTenant } from '@/providers/tenant-provider'

export const Tenant = () => {
  const { isLoading, error } = useTenants()
  const { tenantId } = useTenant()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant</CardTitle>
        <CardDescription> {tenantId} </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-gray-100 dark:bg-foreground/10 rounded text-xs">
          <pre className="mb-2 pre-wrap">Tenants: {tenantId}</pre>
        </div>
      </CardContent>
    </Card>
  )
}
