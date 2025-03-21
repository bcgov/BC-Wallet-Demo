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

interface DisplayAddedCredentialsProps {
  credentials: CredentialDefinitionType[];
  removeCredential: (credentialId: string) => void;
}

export const DisplayAddedCredentials = ({
  credentials,
  removeCredential,
}: DisplayAddedCredentialsProps) => {
  const t = useTranslations();
  // PLEASE FIX ME
  const [localAttributes, setLocalAttributes] = useState<{ [key: string]: any[] }>({});

  const handleAttributeChange = (credentialId: string, attrIndex: number, newValue: string) => {
    setLocalAttributes((prev) => ({
      ...prev,
      [credentialId]: prev[credentialId]?.map(({ id, ...attr }, i) =>
        i === attrIndex ? { ...attr, value: newValue } : attr
      ) || [],
    }));
  };
  

  useEffect(() => {
    const initialAttributes: { [key: string]: any[] } = {};
    credentials.forEach((credential: CredentialDefinitionType) => {
      initialAttributes[credential.id] = credential?.credentialSchema?.attributes?.map((attr: CredentialAttributeType) => ({
        ...attr,
        value: attr.value || "",
      })) || [];
    });
    setLocalAttributes(initialAttributes);
  }, [credentials]);

  const hasCredentials = credentials.length > 0;
  const [isEditing, setIsEditing] = useState(false);
  if (!hasCredentials) {
    return (
      <div className="m-5 p-5 w-full">
        <NoSelection text={t("onboarding.no_credentials_added_message")} />
      </div>
    );
  }

    const updateCredentialSchema = async (credentialData: any) => {
      try {
        const { credentialSchema: { id: credentialSchemaId } } = credentialData
        const cleanedAttributes = Object.values(localAttributes).flatMap((attributes) =>
          attributes.map(({ id, createdAt, updatedAt, ...rest }) => rest)
        );

        const payload = {
          "name": credentialData?.name,
          "version": credentialData?.version,
          "identifierType": credentialData?.identifierType,
          "identifier": credentialData?.identifier,
          "attributes": cleanedAttributes
        }

        const response: any = await apiClient.put(`/credentials/schemas/${credentialSchemaId}`, payload);
        setIsEditing(false);
        return response;
      } catch (error) {
        toast.error("Error updating credential schema");
        throw error;
      }
    };

  return (
    <div className="">
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
                    src={ensureBase64HasPrefix(credential.icon?.content)}
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
                <div className=" flex flex-col justify-center items-start">
                  <p className="font-semibold">{t('credentials.attributes_label')}</p>
                  <p className="">{credential?.credentialSchema?.attributes?.length}</p>
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
                  onClick={(e) => {
                    setIsEditing(true);
                    e.preventDefault();
                    // setEditingCredentials([...editingCredentials, index]);
                  }}
                >
                  ADD ATTRIBUTE VALUES
                </Button>
              </div>
              {/* Proof Request Section */}
              {isEditing && (
                <>
                <div className="p-3 rounded-b-lg bg-white dark:bg-dark-bg">
                  {localAttributes[credential.id]?.map((attr, attrIndex) => (
                    <div key={attr.id || attrIndex} className="grid grid-cols-2 gap-4">
                      {/* Attribute Column */}
                      <div className="space-y-2 flex flex-col justify-center p-4">
                        <label className="text-sm font-bold">Attribute</label>
                        <Input
                          className="text-light-text dark:text-dark-text border border-dark-border dark:border-light-border"
                          value={attr.name}
                          disabled
                        />
                      </div>
    
                      {/* Attribute Value Column */}
                      <div className="space-y-2 flex flex-col justify-center p-4">
                        <label className="text-sm font-bold">Attribute Value</label>
                        <Input
                          className="border border-dark-border dark:border-light-border"
                          value={attr.value}
                          onChange={(e) =>
                            handleAttributeChange(credential.id, attrIndex, e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
    
                <div className="justify-self-center mb-2">
                  <ButtonOutline
                     onClick={() =>
                      updateCredentialSchema({
                        ...credential,
                        attributes: localAttributes[credential.id]?.map(({ id, ...rest }) => rest) || [],
                      })
                    }
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
