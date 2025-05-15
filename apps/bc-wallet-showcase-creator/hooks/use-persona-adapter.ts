'use client'

import { useState, useCallback } from "react";
import { useShowcaseStore } from "@/hooks/use-showcases-store";
import { usePersonas, useCreatePersona, useUpdatePersona, useDeletePersona } from '@/hooks/use-personas';
import { useCreateAsset } from '@/hooks/use-asset';
import { usePersonaStore } from '@/hooks/use-persona-store';
import { useUpdateShowcase } from '@/hooks/use-showcases';
import { Persona, AssetRequest, ShowcaseRequest, PersonaRequest } from "bc-wallet-openapi";
import { toast } from 'sonner';

export const usePersonaAdapter = () => {
  const [headshotImage, setHeadshotImage] = useState<string | null>(null);
  const [isHeadshotImageEdited, setIsHeadshotImageEdited] = useState<boolean>(false);
  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [isBodyImageEdited, setIsBodyImageEdited] = useState<boolean>(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

  const { setEditMode, personaState, setStepState } = usePersonaStore();
  const { selectedPersonaIds, setSelectedPersonaIds, showcase, setShowcase, currentShowcaseSlug } = useShowcaseStore();

  const { data: personasData, isLoading } = usePersonas();
  const { mutateAsync: createPersona } = useCreatePersona();
  const { mutateAsync: updatePersona } = useUpdatePersona();
  const { mutateAsync: deletePersona } = useDeletePersona();
  const { mutateAsync: createAsset } = useCreateAsset();
  const { mutateAsync: updateShowcase } = useUpdateShowcase(currentShowcaseSlug || '');

  const selectedPersona = personasData?.personas?.find(
    (p: Persona) => p.id === selectedPersonaId
  ) || null;

  const handleImageUpdate = useCallback(async (imageData: string | null, mediaType: string, fileName: string, description: string) => {
    if (!imageData) return undefined;

    try {
      const payload: AssetRequest = {
        mediaType,
        content: imageData,
        fileName,
        description
      };

      const response = await createAsset(payload);
      return (response as { asset: { id: string } })?.asset?.id || undefined;
    } catch (error) {
      console.error("Error uploading image:", error);
      return undefined;
    }
  }, [createAsset]);

  const updateShowcaseWithPersona = useCallback(async (personaId: string) => {
    if (!currentShowcaseSlug || !showcase) return;

    try {
      const updatedPersonaIds = new Set([...selectedPersonaIds, personaId]);

      const updatedShowcase: ShowcaseRequest = {
        ...showcase,
        personas: Array.from(updatedPersonaIds)
      };

      await updateShowcase(updatedShowcase as ShowcaseRequest);

      setShowcase(updatedShowcase as ShowcaseRequest);

      return true;
    } catch (error) {
      console.error("Error updating showcase with persona:", error);
      throw error;
    }
  }, [currentShowcaseSlug, showcase, selectedPersonaIds, updateShowcase, setShowcase]);

  const deleteCurrentPersona = useCallback(async () => {
    if (!selectedPersonaId || !selectedPersona) return;

    try {
      await deletePersona(selectedPersona.slug);

      const updatedPersonaIds = selectedPersonaIds.filter(id => id !== selectedPersonaId);
      setSelectedPersonaIds(updatedPersonaIds);

      if (currentShowcaseSlug && showcase) {
        const updatedShowcase: Partial<ShowcaseRequest> = {
          ...showcase,
          personas: updatedPersonaIds
        };

        await updateShowcase(updatedShowcase as ShowcaseRequest);
        setShowcase(updatedShowcase as ShowcaseRequest);
      }

      setSelectedPersonaId(null);
      setStepState('no-selection');

      toast.success('Persona has been deleted.');
    } catch (error) {
      console.error("Error deleting persona:", error);
      toast.error('Error deleting persona.');
    }
  }, [
    selectedPersonaId,
    selectedPersona,
    deletePersona,
    setSelectedPersonaIds,
    selectedPersonaIds,
    currentShowcaseSlug,
    showcase,
    updateShowcase,
    setShowcase,
    setStepState
  ]);

  const handlePersonaSelect = useCallback((persona: Persona) => {
    setSelectedPersonaId(persona.id);
    setStepState('editing-persona');
  }, [setSelectedPersonaId, setStepState]);

  const handleCreateNew = useCallback(() => {
    setSelectedPersonaId(null);
    setHeadshotImage(null);
    setBodyImage(null);
    setIsHeadshotImageEdited(false);
    setIsBodyImageEdited(false);
    setStepState('creating-new');
  }, [setSelectedPersonaId, setStepState]);

  const handleCancel = useCallback(() => {
    setSelectedPersonaId(null);
    setHeadshotImage(null);
    setBodyImage(null);
    setIsHeadshotImageEdited(false);
    setIsBodyImageEdited(false);
    setEditMode(false);
    setStepState('no-selection');
  }, [setSelectedPersonaId, setEditMode, setStepState]);

  const savePersona = useCallback(async (personaData: PersonaRequest) => {
    try {
      let headshotAssetId = selectedPersona?.headshotImage?.id;
      let bodyAssetId = selectedPersona?.bodyImage?.id;

      if (isHeadshotImageEdited) {
        if (headshotImage) {
          headshotAssetId = await handleImageUpdate(
            headshotImage,
            'image/jpeg',
            'Headshot.jpg',
            'A headshot image'
          );
        } else {
          headshotAssetId = undefined;
        }
      }

      if (isBodyImageEdited) {
        if (bodyImage) {
          bodyAssetId = await handleImageUpdate(
            bodyImage,
            'image/jpeg',
            'Body.jpg',
            'A full-body image'
          );
        } else {
          bodyAssetId = undefined;
        }
      }

      const updatedPersonaData: PersonaRequest = {
        ...personaData,
        headshotImage: headshotAssetId,
        bodyImage: bodyAssetId
      };

      let result;

      if (selectedPersonaId && selectedPersona) {
        result = await updatePersona({
          slug: selectedPersona.slug,
          data: updatedPersonaData
        });

        toast.success('Persona has been updated.');
      } else {
        result = await createPersona(updatedPersonaData);
        const newPersonaId = (result as { persona: Persona }).persona.id;

        setSelectedPersonaIds([...selectedPersonaIds, newPersonaId]);

        if (currentShowcaseSlug && showcase) {
          await updateShowcaseWithPersona(newPersonaId);
        }

        setStepState('no-selection');
        toast.success('Persona has been created.');
      }
      setHeadshotImage(null);
      setBodyImage(null);
      setIsHeadshotImageEdited(false);
      setIsBodyImageEdited(false);

      return result;
    } catch (error) {
      console.error("Error saving persona:", error);
      toast.error('Error saving persona.');
      throw error;
    }
  }, [
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
    updateShowcaseWithPersona
  ]);

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
    setSelectedPersonaIds
  };
};