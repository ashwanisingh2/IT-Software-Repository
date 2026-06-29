import { query } from '../config/database';
import { User, UserRole, PaginatedResponse } from '@winrepo/shared';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const res = await query('SELECT id, email, name, role, created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt" FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
    return res.rows[0] || null;
  }

  async findByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
    const res = await query('SELECT id, email, name, password_hash, role, created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt" FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
    return res.rows[0] || null;
  }

  async create(data: { email: string; name: string; password_hash: string; role?: UserRole }): Promise<User> {
    const res = await query(
      'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt"',
      [data.email, data.name, data.password_hash, data.role || 'viewer']
    );
    return res.rows[0];
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const res = await query(
      'UPDATE users SET role = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id, email, name, role, created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt"',
      [role, id]
    );
    if (!res.rows.length) throw new Error('User not found');
    return res.rows[0];
  }

  async softDelete(id: string): Promise<void> {
    await query('UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL', [id]);
  }

  async list(page: number, limit: number): Promise<PaginatedResponse<User>> {
    const offset = (page - 1) * limit;
    const countRes = await query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');
    const total = parseInt(countRes.rows[0].count, 10);

    const res = await query(
      'SELECT id, email, name, role, created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt" FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return {
      success: true,
      data: res.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export const userRepository = new UserRepository();
