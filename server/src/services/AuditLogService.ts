import type { AuditAction, AuditLog, AuditResourceType } from '../db/models/AuditLog'

import { Service } from 'typedi'

import { AuditLogModel } from '../db/models/AuditLog'

export interface AuditLogEntry {
  user_id: string
  action: AuditAction
  resource_type: AuditResourceType
  resource_id?: string
  details?: Record<string, unknown>
}

export interface AuditLogQueryParams {
  page: number
  limit: number
  startDate?: Date
  endDate?: Date
  actions?: AuditAction[]
  resourceTypes?: AuditResourceType[]
  userId?: string
}

export interface AuditLogQueryResult {
  data: AuditLog[]
  total: number
  page: number
  limit: number
}

@Service()
export class AuditLogService {
  public async log(entry: AuditLogEntry): Promise<void> {
    await AuditLogModel.create(entry)
  }

  public async query(params: AuditLogQueryParams): Promise<AuditLogQueryResult> {
    const filter: Record<string, unknown> = {}

    if (params.startDate || params.endDate) {
      const ts: { $gte?: Date; $lte?: Date } = {}
      if (params.startDate) ts.$gte = params.startDate
      if (params.endDate) ts.$lte = params.endDate
      filter.createdAt = ts
    }

    if (params.actions?.length) filter.action = { $in: params.actions }
    if (params.resourceTypes?.length) filter.resource_type = { $in: params.resourceTypes }
    if (params.userId) filter.user_id = params.userId

    const [data, total] = await Promise.all([
      AuditLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((params.page - 1) * params.limit)
        .limit(params.limit)
        .lean(),
      AuditLogModel.countDocuments(filter),
    ])

    return { data: data as AuditLog[], total, page: params.page, limit: params.limit }
  }
}
