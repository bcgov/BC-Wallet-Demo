'use client'

import { useState, useEffect, useCallback } from 'react'
import { useShowcase, useUpdateShowcase } from '@/hooks/use-showcases'
import { useUiStore } from '@/hooks/use-ui-store'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { Showcase, ShowcaseRequest, ShowcaseScenariosInner } from 'bc-wallet-openapi'
import { debugLog, showcaseToShowcaseRequest } from '@/lib/utils'

export function useShowcaseAdapter(slug?: string) {
  const [isLoading, setIsLoading] = useState(true)
  const [localShowcase, setLocalShowcase] = useState<Showcase | null>(null)  
  const { currentShowcaseSlug } = useUiStore()
  const effectiveSlug = slug || currentShowcaseSlug
  
  const { data: showcaseData, isLoading: isShowcaseLoading, refetch } = 
    useShowcase(effectiveSlug || '')
  const { mutateAsync: updateShowcase, isPending: isSaving } = 
    useUpdateShowcase(effectiveSlug || '')
  
  const { 
    showcase: storeShowcase,
    setShowcase: setStoreShowcase,
    setShowcaseFromResponse, 
    setSelectedPersonaIds, 
    setScenarioIds 
  } = useShowcaseStore()
  
  const { 
    setCurrentShowcaseSlug,
  } = useUiStore()
  
  const { 
    selectedCredentialDefinitionIds, 
    tenantId, 
    setTenantId 
  } = useHelpersStore()

  useEffect(() => {
    if (!effectiveSlug) {
      debugLog('No slug provided, skipping data fetch');
      return;
    }
    
    if (showcaseData && !isShowcaseLoading) {
      debugLog(`Showcase data loaded for slug: ${effectiveSlug}`, showcaseData);
      const { showcase: showcaseResponse } = showcaseData
      
      if (!showcaseResponse) {
        debugLog('No showcase found in response');
        return;
      }
      
      if (showcaseResponse.name) {        
        setLocalShowcase(showcaseResponse);
        setIsLoading(false);        
        setTenantId(showcaseResponse.tenantId || '');
        setCurrentShowcaseSlug(showcaseResponse.slug);
        setShowcaseFromResponse(showcaseResponse);
        setStoreShowcase(showcaseToShowcaseRequest(showcaseResponse));
        
        const personaIds = showcaseResponse.personas?.map(p => 
          typeof p === 'string' ? p : p.id) || [];
        const scenarioIds = showcaseResponse.scenarios?.map(s => 
          typeof s === 'string' ? s : s.id) || [];
        
        setSelectedPersonaIds(personaIds);
        setScenarioIds(scenarioIds);
      } else {
        debugLog('Received empty showcase data');
      }
    }
  }, [
    effectiveSlug, showcaseData, isShowcaseLoading, 
    setShowcaseFromResponse, setCurrentShowcaseSlug, 
    setSelectedPersonaIds, setScenarioIds, setTenantId,
    setStoreShowcase
  ]);

  const saveShowcase = useCallback(async (data: ShowcaseRequest) => {
    try {
      if (!effectiveSlug) {
        throw new Error('No showcase slug available');
      }
      
      debugLog('Saving showcase:', data);
      
      const showcaseData = {
        name: data.name,
        description: data.description,
        status: data.status || "ACTIVE",
        hidden: data.hidden || false,
        scenarios: storeShowcase.scenarios,
        credentialDefinitions: selectedCredentialDefinitionIds,
        personas: data.personas || storeShowcase.personas,
        bannerImage: data.bannerImage,
        tenantId,
        completionMessage: data.completionMessage,
      };
      
      const updatedShowcase = await updateShowcase(showcaseData);
      setStoreShowcase(showcaseData);
      
      if (updatedShowcase && updatedShowcase.showcase?.scenarios) {
        const scenarioIds = updatedShowcase.showcase.scenarios.map(
          (s: ShowcaseScenariosInner) => s.id
        );
        setScenarioIds(scenarioIds);
      }
      
      await refetch();
      
      return updatedShowcase;
    } catch (error) {
      console.error("Error saving showcase:", error);
      throw error;
    }
  }, [
    effectiveSlug, storeShowcase, selectedCredentialDefinitionIds, 
    updateShowcase, tenantId, setStoreShowcase, setScenarioIds, refetch
  ]);

  const getBannerImageId = () => {
    const showcase = localShowcase || storeShowcase;
    if (!showcase) return null;
    
    if (typeof showcase.bannerImage === 'string') {
      return showcase.bannerImage;
    }
    
    if (showcase.bannerImage && typeof showcase.bannerImage === 'object' && 'id' in showcase.bannerImage) {
      return showcase.bannerImage.id;
    }
    
    return null;
  };

  const effectiveShowcase = localShowcase || storeShowcase;

  return {
    showcase: effectiveShowcase,
    setShowcase: setStoreShowcase,
    isLoading: isLoading || isShowcaseLoading,    
    saveShowcase,
    refetch,
    isSaving,
    selectedCredentialDefinitionIds,
    bannerImageId: getBannerImageId(),
    slug: effectiveSlug
  };
}