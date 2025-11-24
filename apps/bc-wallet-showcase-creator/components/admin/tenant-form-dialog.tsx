'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tenant, TenantRequest } from '@/lib/api/tenants'

interface TenantFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant?: Tenant | null
  onSubmit: (data: TenantRequest) => Promise<void>
  isCreate: boolean
}

export function TenantFormDialog({ open, onOpenChange, tenant, onSubmit, isCreate }: TenantFormDialogProps) {
  const [formData, setFormData] = useState<TenantRequest>({
    id: '',
    oidcIssuer: '',
    tractionTenantId: '',
    tractionWalletId: '',
    tractionApiUrl: '',
    tractionApiKey: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update form data when dialog opens or tenant changes
  useEffect(() => {
    if (open) {
      if (isCreate) {
        // Reset to empty form for create
        setFormData({
          id: '',
          oidcIssuer: '',
          tractionTenantId: '',
          tractionWalletId: '',
          tractionApiUrl: '',
          tractionApiKey: '',
        })
      } else if (tenant) {
        // Populate with tenant data for edit
        setFormData({
          id: tenant.id,
          oidcIssuer: tenant.oidcIssuer,
          tractionTenantId: tenant.tractionTenantId || '',
          tractionWalletId: tenant.tractionWalletId || '',
          tractionApiUrl: tenant.tractionApiUrl || '',
          tractionApiKey: tenant.tractionApiKey || '',
        })
      }
      setError(null)
    }
  }, [open, tenant, isCreate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Create New Tenant' : 'Edit Tenant'}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Create a new showcase tenant with Traction integration details.'
              : 'Update the tenant configuration and Traction integration details.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="id">Tenant ID *</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="my-tenant-id"
                required
                disabled={!isCreate}
              />
              <p className="text-sm text-muted-foreground">Unique identifier for the tenant (e.g., cdt-dev, my-org-tenant)</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="oidcIssuer">OIDC Issuer *</Label>
              <Input
                id="oidcIssuer"
                value={formData.oidcIssuer}
                onChange={(e) => setFormData({ ...formData, oidcIssuer: e.target.value })}
                placeholder="https://auth-server/auth/realms/BC"
                required
              />
              <p className="text-sm text-muted-foreground">Keycloak OIDC issuer URL</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tractionTenantId">Traction Tenant ID</Label>
              <Input
                id="tractionTenantId"
                value={formData.tractionTenantId}
                onChange={(e) => setFormData({ ...formData, tractionTenantId: e.target.value })}
                placeholder="UUID"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tractionWalletId">Traction Wallet ID</Label>
              <Input
                id="tractionWalletId"
                value={formData.tractionWalletId}
                onChange={(e) => setFormData({ ...formData, tractionWalletId: e.target.value })}
                placeholder="UUID"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tractionApiUrl">Traction API URL</Label>
              <Input
                id="tractionApiUrl"
                value={formData.tractionApiUrl}
                onChange={(e) => setFormData({ ...formData, tractionApiUrl: e.target.value })}
                placeholder="https://traction-tenant-proxy.apps.silver.devops.gov.bc.ca"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tractionApiKey">Traction API Key</Label>
              <Input
                id="tractionApiKey"
                type="password"
                value={formData.tractionApiKey}
                onChange={(e) => setFormData({ ...formData, tractionApiKey: e.target.value })}
                placeholder="Enter API key"
              />
              <p className="text-sm text-muted-foreground">Keep this secure</p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isCreate ? 'Create Tenant' : 'Update Tenant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
