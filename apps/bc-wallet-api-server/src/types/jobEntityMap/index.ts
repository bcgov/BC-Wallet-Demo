export interface JobEntityMap {
  jobId: string
  entityType: string
  entityId: string
  action: string
  status: string
  createdAt: Date
}

export type NewJobEntityMap = Omit<JobEntityMap, 'createdAt'>