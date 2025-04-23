'use client'

import { useCallback } from 'react'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { useUiStore } from '@/hooks/use-ui-store'
import { useUpdateShowcase } from '@/hooks/use-showcases'
import { ShowcaseRequest, ShowcaseScenariosInner } from 'bc-wallet-openapi'

export const useShowcaseAdapter = () => {
  const { 
    showcase,
    setShowcase,
    setScenarioIds,
  } = useShowcaseStore()
  
  const { currentShowcaseSlug } = useUiStore()
  const { mutateAsync: updateShowcase, isPending: isSaving } = useUpdateShowcase(currentShowcaseSlug)
  const { selectedCredentialDefinitionIds, tenantId } = useHelpersStore()

  const saveShowcase = useCallback(async (data: ShowcaseRequest) => {
    try {
      const showcaseData = {
        name: data.name,
        description: data.description,
        status: data.status || "ACTIVE",
        hidden: data.hidden || false,
        scenarios: showcase.scenarios,
        credentialDefinitions: selectedCredentialDefinitionIds,
        personas: data.personas || showcase.personas,
        bannerImage: data.bannerImage,
        tenantId,
      }
      
      const updatedShowcase = await updateShowcase(showcaseData)      
      setShowcase(showcaseData)
      
      if (updatedShowcase && updatedShowcase.showcase?.scenarios) {
        const scenarioIds = updatedShowcase.showcase.scenarios.map((s: ShowcaseScenariosInner) => s.id)
        setScenarioIds(scenarioIds)
      }
      
      return updatedShowcase
    } catch (error) {
      console.error("Error saving showcase:", error)
      throw error
    }
  }, [showcase, selectedCredentialDefinitionIds, updateShowcase, tenantId, setShowcase, setScenarioIds])

  return {
    showcase,
    setShowcase,
    saveShowcase,
    isSaving,
    selectedCredentialDefinitionIds,
  }
}