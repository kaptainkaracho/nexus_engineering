import type { AuditLog, AuditLogFilter, AuditAction } from '@nexus-engineering/shared'
import { getAuditLogDatabase } from './database'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdef', 10)

export class AuditLogRepository {
  private db = getAuditLogDatabase()

  async log(
    userId: string,
    userEmail: string,
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    details?: string | null,
    ipAddress?: string | null,
  ): Promise<AuditLog> {
    const entry: AuditLog = {
      id: nanoid() + '-audit',
      timestamp: new Date().toISOString(),
      userId,
      userEmail,
      action,
      resourceType,
      resourceId,
      details: details || null,
      ipAddress: ipAddress || null,
    }

    this.db.insert(entry)
    return entry
  }

  async list(filter: AuditLogFilter): Promise<{ entries: AuditLog[]; total: number }> {
    return this.db.findAll(filter)
  }

  async getById(id: string): Promise<AuditLog | undefined> {
    return this.db.findById(id)
  }
}

export const auditLogRepository = new AuditLogRepository()
