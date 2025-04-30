'use client'

import { useState, useEffect } from 'react'
import { useShowcase } from '@/hooks/use-showcases'
import { useUiStore } from '@/hooks/use-ui-store'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { Showcase } from 'bc-wallet-openapi'

export function useShowcaseAdapter(slug: string) {
  const [isLoading, setIsLoading] = useState(true)
  const [showcase, setShowcase] = useState<Showcase | null>(null)

  const { data: showcaseData, isLoading: isShowcaseLoading, refetch } = useShowcase(slug)

  const { setCurrentShowcaseSlug } = useUiStore()
  const { setShowcaseFromResponse, setSelectedPersonaIds, setScenarioIds } = useShowcaseStore()
  const { setTenantId } = useHelpersStore()

  useEffect(() => {
    if (showcaseData && !isShowcaseLoading) {
      console.log('showcaseData ==> ', showcaseData)
      const { showcase: showcaseResponse } = showcaseData
      
      if (!showcaseResponse) {
        return
      }
      
      setShowcase(showcaseResponse)
      setIsLoading(false)
      
      setTenantId(showcaseResponse.tenantId || '')
      setCurrentShowcaseSlug(showcaseResponse.slug)
      setShowcaseFromResponse(showcaseResponse)
      
      const personaIds = showcaseResponse.personas?.map(p => 
        typeof p === 'string' ? p : p.id) || [];
      const scenarioIds = showcaseResponse.scenarios?.map(s => 
        typeof s === 'string' ? s : s.id) || [];
      
      setSelectedPersonaIds(personaIds)
      setScenarioIds(scenarioIds)
    }
  }, [showcaseData, isShowcaseLoading, setShowcaseFromResponse, setCurrentShowcaseSlug, 
      setSelectedPersonaIds, setScenarioIds, setTenantId])

  return {
    showcase,
    isLoading: isLoading || isShowcaseLoading,
    refetch
  }
}