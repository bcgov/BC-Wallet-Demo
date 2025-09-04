'use client'

import { useEffect, useState } from 'react'

import { useCredentials } from '@/hooks/use-credentials-store'
import { useTranslations } from 'next-intl'

import Header from '../header'
import { CredentialsDisplay } from './credentials-display'
import { CredentialsForm } from './credentials-form'
import { CredentialsImport } from './credentials-import'
import { useExecutePendingJob, useJobStatus } from '../../hooks/use-job-status'
import { useTenant } from '../../providers/tenant-provider'
import { useQueryClient } from '@tanstack/react-query'

export const CredentialsPage = () => {
  const t = useTranslations()
  const { mode, startImporting } = useCredentials()
  const [searchTerm, setSearchTerm] = useState('')
  const [enablePollingSchema, setEnablePollingSchema] = useState(false);
  const [enablePollingDef, setEnablePollingDef] = useState(false);

  const { data: jobStatus } = useJobStatus('credentialSchema', 'pending', enablePollingSchema);
  const { data: jobStatusDef } = useJobStatus('credentialDefinition', 'pending', enablePollingDef);

  useEffect(() => {
    setEnablePollingSchema((jobStatus?.jobStatus?.length || 0) > 0);
  }, [jobStatus]);

  useEffect(() => {
    setEnablePollingDef((jobStatusDef?.jobStatus?.length || 0) > 0);
  }, [jobStatusDef]);
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  const { mutate: executePendingJob } = useExecutePendingJob()

  const handleImport = () => {
    startImporting()
  }

  useEffect(() => {
    if (jobStatus?.jobStatus?.length) {
      const ids = jobStatus.jobStatus.map((job) => job.jobId).join(',');
      executePendingJob({ jobIds: ids, tenantId });
    }
  }, [jobStatus, tenantId, executePendingJob]);

  useEffect(() => {
    if (jobStatusDef?.jobStatus?.length) {
      const ids = jobStatusDef.jobStatus.map((job) => job.jobId).join(',');
      executePendingJob({ jobIds: ids, tenantId });
    }
  }, [jobStatusDef, tenantId, executePendingJob]);

  useEffect(() => {
    if (!jobStatus?.jobStatus?.length && !jobStatusDef?.jobStatus?.length) {
      queryClient.invalidateQueries({ queryKey: ['credentialDefinitions'] });
    }
  }, [jobStatus, jobStatusDef, queryClient]);

  return (
    <div className="flex flex-col bg-foreground/10 dark:bg-dark-bg dark:bg-none min-h-screen">
      <Header
        title={t('sidebar.credential_library_label')}
        searchTerm={searchTerm}
        showSearch={true}
        setSearchTerm={setSearchTerm}
        buttonLabel={t('credentials.import_header')}
        buttonLink={handleImport}
        buttonBgColor="border-2 border-dark-border dark:border-dark-border cursor-pointer uppercase bg-background dark:bg-dark-tertiary text-light-text dark:text-dark-text hover:bg-light-btn dark:hover:bg-dark-btn-hover font-bold py-2 px-2 transition"
        buttonTextColor="text-black"
        showIcon={false}
      />

      <div className="flex gap-4 p-4 ">
        <div className="w-1/3 bg-background border shadow-md rounded-md flex flex-col">
          <CredentialsDisplay searchTerm={searchTerm} />
        </div>
        <div className="w-2/3 bg-background border shadow-md rounded-md flex flex-col">
          {mode === 'import' ? <CredentialsImport /> : <CredentialsForm />}
        </div>
      </div>
    </div>
  )
}
