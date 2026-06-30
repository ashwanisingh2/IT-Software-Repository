import { EnrollmentToken } from '@winrepo/shared';
import { query } from '../config/database';

export const enrollmentTokenRepository = {
  async create(data: { token: string, label: string, createdBy: string, maxUses: number | null, expiresAt: string | null }): Promise<EnrollmentToken> {
    const result = await query(
      `INSERT INTO enrollment_tokens (token, label, created_by, max_uses, expires_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.token, data.label, data.createdBy, data.maxUses, data.expiresAt]
    );
    return result.rows[0];
  },

  async findByToken(token: string): Promise<EnrollmentToken | null> {
    const result = await query(
      `SELECT * FROM enrollment_tokens WHERE token = $1`,
      [token]
    );
    return result.rows[0] || null;
  },

  async listActive(): Promise<EnrollmentToken[]> {
    const result = await query(
      `SELECT e.*, u.email as "createdByEmail" 
       FROM enrollment_tokens e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.revoked = FALSE ORDER BY e.created_at DESC`
    );
    return result.rows;
  },

  async revoke(id: string): Promise<void> {
    await query(
      `UPDATE enrollment_tokens SET revoked = TRUE WHERE id = $1`,
      [id]
    );
  },

  async incrementUsage(id: string): Promise<void> {
    await query(
      `UPDATE enrollment_tokens SET use_count = use_count + 1 WHERE id = $1`,
      [id]
    );
  }
};
