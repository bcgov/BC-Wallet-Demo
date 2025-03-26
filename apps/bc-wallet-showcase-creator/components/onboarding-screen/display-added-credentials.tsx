import { NoSelection } from "../credentials/no-selection";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn, ensureBase64HasPrefix } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import ButtonOutline from "../ui/button-outline";
import apiClient from "@/lib/apiService";
import { toast } from "sonner";
import { CredentialAttributeType, CredentialDefinitionType } from "@/openapi-types";
import { Control, Controller, Path } from "react-hook-form";
import { FormControl } from "../ui/form";
import { IssueStepFormData } from "@/schemas/onboarding";

interface DisplayAddedCredentialsProps {
  credentials: CredentialDefinitionType[];
  removeCredential: (credentialId: string) => void;
  updateCredentials?: (updatedCredentials: CredentialDefinitionType[]) => void;
  control: Control<IssueStepFormData>
}

export const DisplayAddedCredentials = ({
  credentials,
  removeCredential,
  updateCredentials,
  control
}: DisplayAddedCredentialsProps) => {
  const t = useTranslations();
  const hasCredentials = credentials.length > 0;
  const [isEditing, setIsEditing] = useState(false);
  if (!hasCredentials) {
    return (
      <div className="m-5 p-5 w-full">
        <NoSelection text={t("onboarding.no_credentials_added_message")} />
      </div>
    );
  }

  const handleAttributeChange = (credentialId: string, attrIndex: number, newValue: string) => {
    if (updateCredentials) {
      const updatedCredentials = credentials.map((credential: CredentialDefinitionType) => {
        if (credential.id === credentialId) {
          if (!credential.credentialSchema || !credential.credentialSchema.attributes) {
            return credential;
          }
  
          return {
            ...credential,
            credentialSchema: {
              ...credential.credentialSchema,
              attributes: credential.credentialSchema.attributes.map((attr, i) =>
                i === attrIndex ? { ...attr, value: newValue } : attr
              ),
            },
          };
        }
        return credential;
      });

      updateCredentials(updatedCredentials);
    }
  };

  const handleSaveAttributes = (credentialId: string) => {
    if (!updateCredentials) return;
  
    const updatedCredentials = credentials.map((cred: CredentialDefinitionType) => {
      if (cred.id === credentialId) {
        if (!cred.credentialSchema || !cred.credentialSchema.attributes) {
          return cred;
        }
  
        return {
          ...cred,
          credentialSchema: {
            ...cred.credentialSchema,
            attributes: cred.credentialSchema.attributes.map(attr => ({
              id: attr.id,
              name: attr.name,
              type: attr.type,
              createdAt: attr.createdAt,
              updatedAt: attr.updatedAt,
              value: attr.value,
            })),
          },
        };
      }
      return cred;
    });
  
    updateCredentials(updatedCredentials);
    setIsEditing(false);
  };
  

  return (
    <div>
      <p className="text-md font-bold mt-2">
        {t("credentials.credential_added_label")} {credentials.length}
      </p>

      {credentials.map((credential: any, index: number) => {

        if (!credential) return null;

        return (
          <div key={index} className="flex flex-col pt-2">
            <div className="w-full border border-dark-border dark:border-light-border rounded-t-lg">
              {/* Credential Header */}
              <div
                className={cn(
                  "px-4 py-3 rounded-t-lg flex items-center justify-between",
                  "bg-light-bg dark:bg-dark-bg"
                )}
              >
                {/* Left Section - Image and User Info */}
                <div className="flex items-center flex-1">
                  <Image
                    src={
                      credential.icon?.content
                        ? ensureBase64HasPrefix(
                            credential.icon.content
                          )
                        : "/assets/no-image.jpg"
                    }
                    alt={"Bob"}
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                  <div className="space-y-1 ml-4">
                    <p className="font-semibold">{credential.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {credential?.issuer_name ?? 'Test college'}
                    </p>
                  </div>
                </div>

                {/* Center Section - Attributes */}
                <div className="flex flex-col justify-center items-start">
                  <p className="font-semibold">{t("credentials.attributes_label")}</p>
                  <p>{credential?.credentialSchema?.attributes?.length}</p>
                </div>

                {/* Right Section - Delete Button */}
                <div className="flex-1 flex justify-end items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      removeCredential(credential);
                    }}
                    className="hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <Button
                  variant="ghost"
                  className="text-xs font-semibold hover:bg-transparent hover:underline p-1"
                  onClick={() => setIsEditing(true)}
                >
                  ADD ATTRIBUTE VALUES
                </Button>
              </div>
              {/* Proof Request Section */}
              {isEditing && (
                <>
                  <div className="p-3 rounded-b-lg bg-white dark:bg-dark-bg">
                    {credential.credentialSchema?.attributes?.map((attr:CredentialAttributeType, attrIndex: number) => (
                      <div key={attr.id || attrIndex} className="grid grid-cols-2 gap-4">
                        {/* Attribute Column */}
                        <div className="space-y-2 flex flex-col justify-center p-4">
                          <label className="text-sm font-bold">{t('credentials.attribute_label')}</label>
                          <Input
                            className="text-light-text dark:text-dark-text border border-dark-border dark:border-light-border"
                            value={attr.name}
                            disabled
                          />
                        </div>

                        <div className="space-y-2 flex flex-col justify-center p-4">
                          <label className="text-sm font-bold">{t('credentials.attribute_value_placeholder')}</label>
                          <Controller
                            name={`credentials.${index}.credentialSchema.attributes.${attrIndex}.value` as unknown as Path<IssueStepFormData>} // TODO: fix type issue here
                            control={control}
                            render={({ field }) => (
                              <FormControl>
                                <Input
                                  className="border border-dark-border dark:border-light-border"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleAttributeChange(credential.id, attrIndex, e.target.value);
                                  }}
                                />
                              </FormControl>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="justify-self-center mb-2">
                    <ButtonOutline
                     onClick={() => handleSaveAttributes(credential.id)}               
                    >
                      {t("action.save_label")}
                    </ButtonOutline>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
