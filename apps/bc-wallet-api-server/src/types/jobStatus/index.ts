export interface JobStatus {
  jobId: string
  apiName: string
  endpoint: string
  payloadData?: any
  status: string
  errorMessage?: string
  resultData?: any
  createdAt: Date
  updatedAt: Date
}

export type NewJobStatus = Omit<JobStatus, 'jobId' | 'createdAt' | 'updatedAt'>