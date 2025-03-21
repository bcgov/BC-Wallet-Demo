"use client";

import { useCredentials } from "@/hooks/use-credentials-store";
import { CredentialsDisplay } from "./credentials-display";
import { CredentialsForm } from "./credentials-form";
import { CredentialsImport } from "./credentials-import";
import Header from "../header";
import { useState } from "react";
import { useTranslations } from "next-intl";

export const CredentialsPage = () => {
	const t = useTranslations();
	const { mode, startImporting } = useCredentials();
	const [searchTerm, setSearchTerm] = useState("");

	const handleImport = () => {
		startImporting();
	};

	return (
		<div className="flex flex-col">
			<Header
				title={t("sidebar.credential_library_label")}
				searchTerm={searchTerm}
				showSearch={true}
				setSearchTerm={setSearchTerm}
				buttonLabel={t("credentials.import_header")}
				buttonLink={handleImport}
				buttonBgColor="border-2 border-dark-border dark:border-dark-border cursor-pointer uppercase dark:bg-dark-tertiary text-light-text dark:text-dark-text hover:bg-light-btn dark:hover:bg-dark-btn-hover font-bold py-2 px-2 transition"
				buttonTextColor="text-black"
				showIcon={false}
			/>

			<div className="flex gap-4 p-4">
				<div className="w-1/3 bg-[white] dark:bg-dark-bg-secondary border shadow-md rounded-md flex flex-col">
					<CredentialsDisplay searchTerm={searchTerm} />
				</div>
				<div className="w-2/3 bg-white dark:bg-dark-bg-secondary border shadow-md rounded-md flex flex-col">
					{mode === "import" ? <CredentialsImport /> : <CredentialsForm />}
				</div>
			</div>
		</div>
	);
};
