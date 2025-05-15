'use client'

import { useState, useEffect, useCallback } from 'react'
import { useShowcase, useUpdateShowcase } from '@/hooks/use-showcases'
import { useShowcaseStore } from '@/hooks/use-showcases-store'
import { useHelpersStore } from '@/hooks/use-helpers-store'
import { Showcase, ShowcaseRequest, ShowcaseScenariosInner } from 'bc-wallet-openapi'
import { debugLog } from '@/lib/utils'
import { showcaseToShowcaseRequest } from '@/lib/parsers'

export function useShowcaseAdapter(slug?: string) {
  const [isLoading, setIsLoading] = useState(true)
  const [localShowcase, setLocalShowcase] = useState<Showcase | null>(null)
  const {
    showcase: storeShowcase,
    setShowcase: setStoreShowcase,
    setSelectedPersonaIds,
    setScenarioIds,
    setCurrentShowcaseSlug,
    currentShowcaseSlug
  } = useShowcaseStore()
  const effectiveSlug = slug || currentShowcaseSlug

  const { data: showcaseData, isLoading: isShowcaseLoading, refetch } =
    useShowcase(effectiveSlug || '')
  const { mutateAsync: updateShowcase, isPending: isSaving } =
    useUpdateShowcase(effectiveSlug || '')

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
    setCurrentShowcaseSlug,
    setSelectedPersonaIds, setScenarioIds, setTenantId,
    setStoreShowcase
  ]);

  const saveShowcase = useCallback(async (data: ShowcaseRequest) => {
    try {
      if (!effectiveSlug) {
        throw new Error('No showcase slug available');
      }

      const showcaseData = {
        name: data.name,
        description: data.description,
        status: data.status || "ACTIVE",
        hidden: data.hidden || false,
        scenarios: Array.from(new Set(storeShowcase.scenarios || [])),
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

  const effectiveShowcase = localShowcase || storeShowcase;

  return {
    showcase: effectiveShowcase,
    setShowcase: setStoreShowcase,
    isLoading: isLoading || isShowcaseLoading,
    saveShowcase,
    refetch,
    isSaving,
    selectedCredentialDefinitionIds,
    slug: effectiveSlug
  };
}