'use client'

import { signOut } from 'next-auth/react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTenants } from '@/hooks/use-tenants'
import { getTenantId, useTenant } from '@/providers/tenant-provider'
import { useHelpersStore } from '@/hooks/use-helpers-store'

export const Tenant = () => {
  const { isLoading, error } = useTenants()
  // const { setTenantId } = useHelpersStore()
  // const tenantId = getTenantId();
  const { tenantId, setTenantId } = useTenant()
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
      <CardFooter>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => console.log('create tenant')}>
          {/* <Button variant="outline" onClick={handleCreateTenant}> */}
            Create Tenant
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
