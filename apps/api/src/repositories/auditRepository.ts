import { query } from '../config/database';
import { AuditLog, PaginatedResponse } from '@winrepo/shared';

export class AuditRepository {
  async log(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    query(
      `INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [data.userId, data.userEmail, data.action, data.resourceType, data.resourceId, JSON.stringify(data.oldValue), JSON.stringify(data.newValue), data.ipAddress, data.userAgent]
    ).catch(() => {}); // Fire and forget logging
  }

  async list(filters: { userId?: string; resourceType?: string; action?: string; from?: string; to?: string }, page: number, limit: number): Promise<PaginatedResponse<AuditLog>> {
    let where = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters.userId) { where += ` AND user_id = $${paramCount++}`; params.push(filters.userId); }
    if (filters.resourceType) { where += ` AND resource_type = $${paramCount++}`; params.push(filters.resourceType); }
    if (filters.action) { where += ` AND action = $${paramCount++}`; params.push(filters.action); }
    if (filters.from) { where += ` AND created_at >= $${paramCount++}`; params.push(filters.from); }
    if (filters.to) { where += ` AND created_at <= $${paramCount++}`; params.push(filters.to); }

    const offset = (page - 1) * limit;
    const countRes = await query(`SELECT COUNT(*) FROM audit_logs ${where}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const res = await query(
      `SELECT *, user_id as "userId", user_email as "userEmail", resource_type as "resourceType", resource_id as "resourceId", old_value as "oldValue", new_value as "newValue", ip_address as "ipAddress", user_agent as "userAgent", created_at as "createdAt" FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    return {
      success: true,
      data: res.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }
}

export const auditRepository = new AuditRepository();
