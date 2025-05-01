import { NoSelection } from "../credentials/no-selection";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { cn, baseUrl } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import ButtonOutline from "../ui/button-outline";
import { useUpdateCredentialSchema } from "@/hooks/use-credentials";
import type { CredentialSchemaRequest, CredentialAttribute, CredentialDefinition } from "bc-wallet-openapi";

interface DisplayAddedCredentialsProps {
  credentials: CredentialDefinition[];
  removeCredential: (credential: CredentialDefinition) => void;
  updateCredentials?: (updatedCredentials: CredentialDefinition[]) => void;
}

export const DisplayAddedCredentials = ({
  credentials,
  removeCredential,
  updateCredentials,
}: DisplayAddedCredentialsProps) => {
  const t = useTranslations();
  const hasCredentials = (credentials || []).length > 0;
  const updateCredentialSchema = useUpdateCredentialSchema();

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
      const updatedCredentials = credentials.map((credential: CredentialDefinition) => {
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

  const handleSaveAttributes = async() => {
    if (!updateCredentials) return;
  
    const updatedCredentials = await Promise.all(
      credentials.map(async (cred: CredentialDefinition) => {
        const updatedAttrs = cred.credentialSchema?.attributes?.map(attr => ({
          ...attr,
          value: attr.value || '',
        })) || [];
  
        const schemaPayload: CredentialSchemaRequest = {
          name: cred.credentialSchema.name,
          version: cred.credentialSchema.version,
          identifierType: cred.credentialSchema.identifierType || 'DID',
          source: cred.credentialSchema.source || 'CREATED',
          attributes: updatedAttrs.map(attr => ({
            name: attr.name,
            value: attr.value,
            type: attr.type,
          })),
        };
  
        try {
          const schemaResponse = await updateCredentialSchema.mutateAsync({
            credentialSchemaId: cred.credentialSchema.id,
            data: schemaPayload,
          });
          console.log(`Updated schema for credential ${cred.id}`, schemaResponse);
        } catch (error) {
          console.error(`Failed to update schema for credential ${cred.id}`, error);
        }
  
        return {
          ...cred,
          credentialSchema: {
            ...cred.credentialSchema,
            attributes: updatedAttrs,
          },
        };
      })
    );

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
                    src={credential.icon?.id ? `${baseUrl}/assets/${credential.icon.id}/file` : '/assets/no-image.jpg'}
                    alt={credential?.icon?.description || 'default credential icon'}
                    width={50}
                    height={50}
                    className="rounded-full object-cover"
                    unoptimized
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.src = '/assets/no-image.jpg'
                    }}
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
                      e.preventDefault()
                      removeCredential(credential)
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
                  type="button"
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
                    {credential.credentialSchema?.attributes?.map((attr:CredentialAttribute, attrIndex: number) => (
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
                            <Input
                              value={attr.value || ''}
                              onChange={(e) => handleAttributeChange(credential.id, attrIndex, e.target.value)}
                            />
                          </div>
                        </div>
                    ))}
                  </div>

                  <div className="justify-self-center mb-2">
                    <ButtonOutline
                     type="button"
                     onClick={() => handleSaveAttributes()}               
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
