'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useOnboardingAdapter } from "@/hooks/use-onboarding-adapter"
import { Button } from "@/components/ui/button"

export function IssuanceState() {
  const { steps, personas } = useOnboardingAdapter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issuance State</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <h2>Personas</h2>
          {personas.map((persona, idx) => (
            <div key={idx}>{persona.id} - {persona.name}</div>
          ))}
        </div>
        <div>
          <h2>Steps</h2>
          {steps.map((step, idx) => (
            <div key={idx}>{step.id} - {step.type} - {step.title}</div>
          ))}
        </div>
      </CardContent>
      <CardFooter>  
        <Button onClick={() => {}}>Reset</Button>
      </CardFooter>
    </Card>
  )
}
  
