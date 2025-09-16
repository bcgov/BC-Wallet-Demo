import { useState, useCallback, useEffect, useMemo } from "react";
import { useShowcaseStore } from "@/hooks/use-showcases-store";
import { usePersonas, useCreatePersona, useUpdatePersona, useDeletePersona } from '@/hooks/use-personas';
import { useCreateAsset } from '@/hooks/use-asset';
import { usePersonaStore } from '@/hooks/use-persona-store';
import { useUpdateShowcase } from '@/hooks/use-showcases'
import { Persona, AssetRequest, ShowcaseRequest, PersonaRequest, ShowcaseResponse } from "bc-wallet-openapi";
import { toast } from 'sonner';
import { useQueryClient } from "@tanstack/react-query";
import { showcaseToShowcaseRequest } from "@/lib/parsers";
import apiClient from "@/lib/apiService";
import { useUpdateScenario as useUpdateIssuanceScenario } from '@/hooks/use-onboarding'
import { useUpdateScenario as useUpdatePresentationScenario } from '@/hooks/use-presentation'

type PersonaRequestWithImageType = PersonaRequest & {
  headshotImageType?: string;
  bodyImageType?: string;
}

export const usePersonaAdapter = () => {
  const [headshotImage, setHeadshotImage] = useState<string | null>(null);
  const [isHeadshotImageEdited, setIsHeadshotImageEdited] = useState<boolean>(false);
  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [isBodyImageEdited, setIsBodyImageEdited] = useState<boolean>(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

  const { setEditMode, personaState, setStepState } = usePersonaStore();
  const { selectedPersonaIds, setSelectedPersonaIds, showcase, setShowcase, currentShowcaseSlug } = useShowcaseStore();
  const queryClient = useQueryClient()

  const { data: personasData, isLoading } = usePersonas();
  const { mutateAsync: createPersona } = useCreatePersona();
  const { mutateAsync: updatePersona } = useUpdatePersona();
  const { mutateAsync: deletePersona } = useDeletePersona();
  const { mutateAsync: createAsset } = useCreateAsset();
  const { mutateAsync: updateShowcase } = useUpdateShowcase(currentShowcaseSlug || '');
  const { mutateAsync: updateIssuanceScenario } = useUpdateIssuanceScenario();
  const { mutateAsync: updatePresentationScenario } = useUpdatePresentationScenario();

  const InvalidPersonaState = async() => {
    queryClient.invalidateQueries({ queryKey: ['personas'] })
  };

  useEffect(() => {
    InvalidPersonaState()
  },[])

  const selectedPersona = personasData?.personas?.find((p: Persona) => p.id === selectedPersonaId) || null

  const handleImageUpdate = useCallback(
    async (imageData: string | null, mediaType: string, fileName: string, description: string) => {
      if (!imageData) return undefined

      try {
        const payload: AssetRequest = {
          mediaType,
          content: imageData,
          fileName,
          description,
        }

        const response = await createAsset(payload)
        return (response as { asset: { id: string } })?.asset?.id || undefined
      } catch (error) {
        console.error('Error uploading image:', error)
        return undefined
      }
    },
    [createAsset],
  )

  const updateShowcaseWithPersona = useCallback(
    async (personaIds: string[]) => {
      if (!currentShowcaseSlug || !showcase) return

      try {
        // Get the current state of the showcase from the server to compare against
        const showcaseResponse = (await apiClient.get(`/showcases/${currentShowcaseSlug}`)) as ShowcaseResponse
        const serverShowcase = showcaseResponse?.showcase
        if (!serverShowcase) {
          throw new Error('Showcase data is undefined')
        }

        const oldPersonaIds = new Set(serverShowcase.personas?.map((p) => p.id) || [])
        const newPersonaIds = new Set(personaIds)

        // Update the showcase's main persona list first
        const parsed = showcaseToShowcaseRequest(serverShowcase)
        const updatedShowcase: ShowcaseRequest = {
          ...parsed,
          personas: Array.from(newPersonaIds),
        }
        await updateShowcase(updatedShowcase as ShowcaseRequest)

        // Determine which personas were added and removed
        const addedPersonaIds = personaIds.filter((id) => !oldPersonaIds.has(id))
        const removedPersonaIds = [...oldPersonaIds].filter((id) => !newPersonaIds.has(id))

        // Iterate through scenarios and update them based on persona changes
        for (const scenario of serverShowcase.scenarios || []) {
          const scenarioResponse = await apiClient.get(`/scenarios/${scenario.type.toLowerCase()}s/${scenario.slug}`)
          let fullScenario
          if (scenario.type === 'ISSUANCE') {
            //@ts-ignore
            fullScenario = scenarioResponse.issuanceScenario
          } else if (scenario.type === 'PRESENTATION') {
            //@ts-ignore
            fullScenario = scenarioResponse.presentationScenario
          }

          if (fullScenario) {
            let scenarioPersonaIds = fullScenario.personas?.map((p: { id: string }) => p.id) || []
            let needsUpdate = false

            // Handle persona removals from the scenario
            if (removedPersonaIds.length > 0) {
              const initialLength = scenarioPersonaIds.length
              scenarioPersonaIds = scenarioPersonaIds.filter((id:any) => !removedPersonaIds.includes(id))
              if (scenarioPersonaIds.length !== initialLength) {
                needsUpdate = true
              }
            }

            // Handle persona additions, but only if the scenario has no personas (replacement)
            if (addedPersonaIds.length > 0 && scenarioPersonaIds.length === 0) {
              scenarioPersonaIds.push(...addedPersonaIds)
              needsUpdate = true
            }

            if (needsUpdate) {
              const commonData = {
                name: fullScenario.name,
                description: fullScenario.description,
                steps: fullScenario.steps.map(({ screenId = 'INFO', ...stepRest }) => ({
                  ...stepRest,
                  screenId,
                  actions:
                  //@ts-ignore
                    stepRest.actions?.map(({ id, createdAt, updatedAt, ...actionRest }) => ({
                      ...actionRest,
                    })) ?? [],
                })),
                hidden: false,
                personas: scenarioPersonaIds,
                slug: fullScenario.slug,
              }

              if (scenario.type === 'ISSUANCE') {
                const updatedScenarioData = { ...commonData, issuer: fullScenario.issuer?.id }
                await updateIssuanceScenario({ slug: fullScenario.slug, data: updatedScenarioData })
              } else if (scenario.type === 'PRESENTATION') {
                const updatedScenarioDataPresentation = { ...commonData, relyingParty: fullScenario.relyingParty?.id }
                await updatePresentationScenario({ slug: fullScenario.slug, data: updatedScenarioDataPresentation })
              }
            }
          }
        }

        // Refresh the local showcase state to reflect all changes
        const updatedShowcaseResponse = (await apiClient.get(
          `/showcases/${currentShowcaseSlug}`,
        )) as ShowcaseResponse
        //@ts-ignore
        setShowcase(updatedShowcaseResponse.showcase as ShowcaseRequest)
        
        // Invalidate showcase queries to ensure all components get fresh data
        queryClient.invalidateQueries({ queryKey: ['showcase', currentShowcaseSlug] })
        queryClient.invalidateQueries({ queryKey: ['showcases'] })

        return true
      } catch (error) {
        console.error('Error updating showcase with persona:', error)
        throw error
      }
    },
    [currentShowcaseSlug, showcase, updateShowcase, setShowcase, updateIssuanceScenario, updatePresentationScenario],
  )

  const deleteCurrentPersona = useCallback(async () => {
    if (!selectedPersonaId || !selectedPersona) return

    try {
      await deletePersona(selectedPersona.slug)

      const updatedPersonaIds = selectedPersonaIds.filter((id) => id !== selectedPersonaId)
      setSelectedPersonaIds(updatedPersonaIds)

      if (currentShowcaseSlug && showcase) {
        await updateShowcaseWithPersona(updatedPersonaIds)
      }

      setSelectedPersonaId(null)
      setStepState('no-selection')

      toast.success('Persona has been deleted.')
    } catch (error) {
      console.error('Error deleting persona:', error)
      toast.error('Error deleting persona.')
    }
  }, [
    selectedPersonaId,
    selectedPersona,
    deletePersona,
    setSelectedPersonaIds,
    selectedPersonaIds,
    currentShowcaseSlug,
    showcase,
    setStepState,
    updateShowcaseWithPersona,
  ])

  const handlePersonaSelect = useCallback(
    (persona: Persona) => {
      setSelectedPersonaId(persona.id)
      setStepState('editing-persona')
    },
    [setSelectedPersonaId, setStepState],
  )

  const handleCreateNew = useCallback(() => {
    setSelectedPersonaId(null)
    setHeadshotImage(null)
    setBodyImage(null)
    setIsHeadshotImageEdited(false)
    setIsBodyImageEdited(false)
    setStepState('creating-new')
  }, [setSelectedPersonaId, setStepState])

  const handleCancel = useCallback(() => {
    setSelectedPersonaId(null)
    setHeadshotImage(null)
    setBodyImage(null)
    setIsHeadshotImageEdited(false)
    setIsBodyImageEdited(false)
    setEditMode(false)
    setStepState('no-selection')
  }, [setSelectedPersonaId, setEditMode, setStepState])

  const savePersona = useCallback(
    async (personaData: PersonaRequestWithImageType) => {
      try {
        let headshotAssetId = selectedPersona?.headshotImage?.id
        let bodyAssetId = selectedPersona?.bodyImage?.id

        if (isHeadshotImageEdited) {
          if (headshotImage) {
            headshotAssetId = await handleImageUpdate(
              headshotImage,
              personaData.headshotImageType || 'image/svg+xml',
              'Headshot.jpg',
              'A headshot image',
            )
          } else {
            headshotAssetId = undefined
          }
        }

        if (isBodyImageEdited) {
          if (bodyImage) {
            bodyAssetId = await handleImageUpdate(
              bodyImage,
              personaData.bodyImageType || 'image/svg+xml',
              'FullBody.jpg',
              'A full-body image',
            )
          } else {
            bodyAssetId = undefined
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { headshotImageType, bodyImageType, ...restOfPersonaData } = personaData

        const finalPersonaData: PersonaRequest = {
          ...restOfPersonaData,
          headshotImage: headshotAssetId,
          bodyImage: bodyAssetId,
        }

        let result

        if (selectedPersonaId && selectedPersona) {
          result = await updatePersona({
            slug: selectedPersona.slug,
            data: finalPersonaData,
          })

          toast.success('Character has been updated.')
        } else {
          result = await createPersona(finalPersonaData)
          const newPersonaId = (result as { persona: Persona }).persona.id

          const newPersonaIds = [...selectedPersonaIds, newPersonaId]
          setSelectedPersonaIds(newPersonaIds)

          if (currentShowcaseSlug && showcase) {
            await updateShowcaseWithPersona(newPersonaIds)
          }

          setSelectedPersonaId(newPersonaId)
          setStepState('editing-persona')
          toast.success('Character has been created.')
        }

        return result
      } catch (error) {
        console.error('Error saving persona:', error)
        toast.error('Error saving persona.')
        throw error
      }
    },
    [
      selectedPersona,
      isHeadshotImageEdited,
      isBodyImageEdited,
      headshotImage,
      bodyImage,
      selectedPersonaId,
      handleImageUpdate,
      updatePersona,
      createPersona,
      selectedPersonaIds,
      setSelectedPersonaIds,
      currentShowcaseSlug,
      showcase,
      updateShowcaseWithPersona,
      setStepState,
    ],
  )

  return {
    selectedPersonaId,
    setSelectedPersonaId,
    headshotImage,
    setHeadshotImage,
    isHeadshotImageEdited,
    setIsHeadshotImageEdited,
    bodyImage,
    setBodyImage,
    isBodyImageEdited,
    setIsBodyImageEdited,
    selectedPersona,
    personasData,
    isLoading,

    savePersona,
    deleteCurrentPersona,
    updateShowcaseWithPersona,
    handlePersonaSelect,
    handleCreateNew,
    handleCancel,

    setEditMode,
    personaState,
    setStepState,

    selectedPersonaIds,
    setSelectedPersonaIds,
  }
}
