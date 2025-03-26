import { ShowcaseJSON } from "@/types";
import Image from "next/image";
import { Label } from "../ui/label";
import { useTranslations } from "next-intl";
import { useCredentials } from "@/hooks/use-credentials-store";
import { ensureBase64HasPrefix } from "@/lib/utils";
import { CredentialDefinition } from "@/openapi-types";

interface DisplaySearchResultsProps {
  searchResults: any;
  // searchResults: typeof CredentialDefinition._type[];
  addCredential: (credentialId: string) => void;
}

export const DisplaySearchResults = ({
  searchResults,
  addCredential,
}: DisplaySearchResultsProps) => {
  const t = useTranslations();
  const MAX_SEARCH_CREDENTIALS = 8;
  const visibleResults = searchResults.slice(0, MAX_SEARCH_CREDENTIALS);
  const { setSelectedCredential } = useCredentials();
  
  return (
    <div className="mb-6">
      {visibleResults.length > 0 && (
        <Label className="text-md font-bold">
          {t("credentials.result_label")}
        </Label>
      )}
      {visibleResults.map((result:any) => {

        if (!result) return null;
        return (
          <button
            key={result.id}
            className="basic-step dropdown-border w-full flex flex-row text-sm mb-2 mt-2 rounded border-t-[1px] border-b-[1px] border-gray-100"
            onClick={(e) => {
              e.preventDefault();
              addCredential(result);
              setSelectedCredential(result) 
            }}
          >
            <div className="grid grid-cols-3 w-full py-3 bg-light-bg hover:bg-light-btn-hover dark:bg-dark-bg dark:hover:bg-dark-btn-hover text-light-text dark:text-dark-text p-2">
              {/* Left Section - Image and User Info */}
              <div className="flex items-center flex-1">
                <Image
                  src={
                    result.icon?.content
                      ? ensureBase64HasPrefix(
                        result.icon.content
                      )
                      : "/assets/no-image.jpg"
                  }
                  alt={result.name}
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div className="space-y-1 ml-4 text-start">
                  <p className="font-semibold">{result.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.issuer_name ?? 'Test college'}
                  </p>
                </div>
              </div>

              {/* Center Section - Attributes */}
              <div className="flex ml-28 flex-col justify-center items-start text-start">
                <p className="font-semibold">{t('credentials.attributes_label')}</p>
                <p>{result.credentialSchema.attributes.length}</p>
              </div>
            </div>
          </button>
        );
      })}

      {searchResults.length > MAX_SEARCH_CREDENTIALS && (
        <p className="text-sm text-muted-foreground mt-2">
          Showing {MAX_SEARCH_CREDENTIALS} of {searchResults.length} results.
          Please refine your search to see more specific results.
        </p>
      )}
    </div>
  );
};
