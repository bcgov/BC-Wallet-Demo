"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormTextArea, FormTextInput } from "@/components/text-input";
import { Edit, Monitor } from "lucide-react";
import { useOnboarding, useCreateScenario } from "@/hooks/use-onboarding";
import { BasicStepFormData } from "@/schemas/onboarding";
import { basicStepSchema } from "@/schemas/onboarding";
import { LocalFileUpload } from "./local-file-upload";
import { useTranslations } from "next-intl";
import StepHeader from "../step-header";
import ButtonOutline from "../ui/button-outline";
import DeleteModal
   from "../delete-modal";
import { useRouter } from "@/i18n/routing";
import { ErrorModal } from "../error-modal";
import Loader from "../loader";
import {
  ScenarioRequestType,
  IssuanceScenarioResponseType,
} from "@/openapi-types";
import { useShowcaseStore } from "@/hooks/use-showcases-store";
import { toast } from "sonner";
import { useDeleteStep } from "@/hooks/use-issue-step";
import { useHelpersStore } from "@/hooks/use-helpers-store";

export const BasicStepEdit = () => {
  const t = useTranslations();
  const {
    screens,
    selectedStep,
    setSelectedStep,
    setStepState,
    stepState,
    removeStep,
  } = useOnboarding();

  const { mutateAsync: deleteStep } = useDeleteStep();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { mutateAsync } = useCreateScenario();
  const currentStep: any = selectedStep !== null ? screens[selectedStep] : null;
  const { showcase, setScenarioIds } = useShowcaseStore();
  const { issuerId } = useHelpersStore();
  
  const personas = showcase.personas || [];
  const router = useRouter();

  const isEditMode = stepState === "editing-basic";
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setErrorModal] = useState(false);

  const defaultValues = currentStep
    ? {
        title: currentStep.title,
        description: currentStep.description,
        asset: currentStep.asset || "",
      }
    : {
        title: "",
        description: "",
        asset: "",
      };

  const form = useForm<BasicStepFormData>({
    resolver: zodResolver(basicStepSchema),
    defaultValues,
    mode: "all",
  });

  React.useEffect(() => {
    if (currentStep) {
      form.reset({
        title: currentStep.title,
        description: currentStep.description,
        asset: currentStep.asset || "",
      });
    }
  }, [currentStep, form]);

  const onSubmit = (data: any) => {
    handleCreateScenario();
  };

  const handleDeleteStep = async (stepId: any) => {
    try {
      if (!stepId) {
        console.error("Error: Step ID is required for deletion.");
        return;
      }
      removeStep(stepId);
      await deleteStep({
        issuanceScenarioSlug: "credential-issuance-flow",
        stepId,
      });
      toast.success("Step deleted successfully!");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setErrorModal(true);
    }
  };

  const handleCreateScenario = async () => {
    const data: ScenarioRequestType = {
      name: "example_name",
      description: "example_description",
      type: "ISSUANCE" as "ISSUANCE" | "PRESENTATION",
      issuer: issuerId,
      steps: [
        {
          title: "example_title",
          description: "example_description",
          order: 1,
          type: "HUMAN_TASK",
          asset: "0d5094f0-c95d-414c-b810-44a9db5ccb5c",
          actions: [
            {
              title: "example_title",
              actionType: "ARIES_OOB",
              text: "example_text",
              proofRequest: {
                attributes: {
                  attribute1: {
                    attributes: ["attribute1", "attribute2"],
                    restrictions: ["restriction1", "restriction2"],
                  },
                },
                predicates: {
                  predicate1: {
                    name: "example_name",
                    type: "example_type",
                    value: "example_value",
                    restrictions: ["restriction1", "restriction2"],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [...personas],
    };

    await mutateAsync(data, {
      onSuccess: (data: unknown) => {
        toast.success("Scenario Created");
        setScenarioIds([
          (data as IssuanceScenarioResponseType).issuanceScenario.id,
        ]);
        router.push(`/showcases/create/scenarios`);
      },
    });
  };

  const handleCancel = () => {
    form.reset();
    setStepState("no-selection");
    setSelectedStep(null);
  };

  if (selectedStep === null) {
    return null;
  }
  console.log('FormValues',form.getValues())
  if (!isEditMode && currentStep) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between mt-3">
          <div>
            <p className="text-foreground text-sm">
              {t("onboarding.section_title")}
            </p>
            <h3 className="text-2xl font-bold text-foreground">
              {t("onboarding.details_step_header_title")}
            </h3>
          </div>
          <Button
            variant="outline"
            onClick={() => setStepState("editing-basic")}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {t("action.edit_label")}
          </Button>
        </div>
        <hr />

        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {t("onboarding.page_title_label")}
            </h4>
            <p className="text-lg">{currentStep.title}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {t("onboarding.page_description_label")}
            </h4>
            <p className="text-lg whitespace-pre-wrap">
              {currentStep.description}
            </p>
          </div>

          {currentStep.image && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t("onboarding.icon_label")}
              </h4>
              <div className="w-32 h-32 rounded-lg overflow-hidden border">
                <img
                  src={currentStep.image}
                  alt="Step icon"
                  className="w-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {showErrorModal && (
        <ErrorModal
          errorText="Unknown error occurred"
          setShowModal={setErrorModal}
        />
      )}
      {loading ? (
        <Loader text="Creating Step" />
      ) : (
        <>
          <StepHeader
            icon={<Monitor strokeWidth={3} />}
            title={t("onboarding.basic_step_header_title")}
            onActionClick={(action) => {
              switch (action) {
                case "save":
                  console.log("Save Draft clicked");
                  break;
                case "preview":
                  console.log("Preview clicked");
                  break;
                case "revert":
                  console.log("Revert Changes clicked");
                  break;
                case "delete":
                  console.log("Delete Page clicked");
                  setIsModalOpen(true);
                  setIsOpen(false);
                  break;
                default:
                  console.log("Unknown action");
              }
            }}
          />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-6">
                <FormTextInput
                  control={form.control}
                  label={t("onboarding.page_title_label")}
                  name="title"
                  register={form.register}
                  error={form.formState.errors.title?.message}
                  placeholder={t("onboarding.page_title_placeholder")}
                />

                <div className="space-y-2">
                  <FormTextArea
                    control={form.control}
                    label={t("onboarding.page_description_label")}
                    name="description"
                    register={form.register}
                    error={form.formState.errors.description?.message}
                    placeholder={t("onboarding.page_description_placeholder")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <LocalFileUpload
                    text={t("onboarding.icon_label")}
                    element="asset"
                    handleLocalUpdate={(_, value) =>
                      form.setValue("asset", value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  {form.formState.errors.asset && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.asset.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-auto pt-4 border-t flex justify-end gap-3">
                <ButtonOutline onClick={handleCancel} type="button">
                  {t("action.cancel_label")}
                </ButtonOutline>
                <ButtonOutline type="submit">{"Save Changes"}</ButtonOutline>

                <ButtonOutline
                  type="submit"
                  disabled={!form.formState.isDirty || !form.formState.isValid}
                >
                  {t("action.next_label")}
                </ButtonOutline>
              </div>
            </form>
          </Form>
          <DeleteModal
            isLoading={loading}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onDelete={() => handleDeleteStep(currentStep?.id)}
            header="Are you sure you want to delete this page?"
            description="Are you sure you want to delete this page?"
            subDescription="<b>This action cannot be undone.</b>"
            cancelText="CANCEL"
            deleteText="DELETE"
          />
        </>
      )}
    </>
  );
};
