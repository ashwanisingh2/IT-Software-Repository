import { dbPool } from '../config/database';
import { User, UserRole } from '@winrepo/shared';

export class UserRepository {
  async findByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
    const result = await dbPool.query(
      'SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await dbPool.query(
      'SELECT id, email, role, created_at, updated_at FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(email: string, passwordHash: string, role: UserRole = UserRole.VIEWER): Promise<User> {
    const result = await dbPool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at, updated_at',
      [email, passwordHash, role]
    );
    return result.rows[0];
  }

  async updateRole(id: string, role: UserRole): Promise<User | null> {
    const result = await dbPool.query(
      'UPDATE users SET role = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id, email, role, created_at, updated_at',
      [role, id]
    );
    return result.rows[0] || null;
  }

  async findAll(): Promise<User[]> {
    const result = await dbPool.query(
      'SELECT id, email, role, created_at, updated_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    return result.rows;
  }
}
