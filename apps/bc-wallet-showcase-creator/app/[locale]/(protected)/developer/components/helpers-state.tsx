'use client'

import { useHelpersStore } from '@/hooks/use-helpers-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function Helpers() {
  const { issuerId, relayerId, selectedCredentialDefinitionIds, reset } = useHelpersStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Helpers</CardTitle>
      </CardHeader>
      <CardContent>
        <div>Issuer ID: {issuerId}</div>
        <div>Relayer ID: {relayerId}</div>
        <div>Selected Credential Definition IDs: {selectedCredentialDefinitionIds.join(', ')}</div>
      </CardContent>
      <CardFooter>  
        <Button onClick={() => reset()}>Reset</Button>
      </CardFooter>
    </Card>
  )
}
