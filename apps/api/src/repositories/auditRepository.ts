import { dbPool } from '../config/database';

export class AuditRepository {
  async log(userId: string | null, action: string, resourceType: string, resourceId: string | null, oldValue: any, newValue: any, ipAddress: string | null): Promise<void> {
    await dbPool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_value, new_value, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, resourceType, resourceId, JSON.stringify(oldValue), JSON.stringify(newValue), ipAddress]
    );
  }

  async findAll(limit: number = 100): Promise<any[]> {
    const result = await dbPool.query(
      `SELECT a.*, u.email as user_email 
       FROM audit_logs a 
       LEFT JOIN users u ON a.user_id = u.id 
       ORDER BY a.created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}
