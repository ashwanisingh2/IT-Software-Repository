import { dbPool } from '../config/database';

export class DocRepository {
  async findAll(): Promise<any[]> {
    const result = await dbPool.query('SELECT id, title, category, created_at, updated_at FROM docs WHERE deleted_at IS NULL ORDER BY updated_at DESC');
    return result.rows;
  }

  async findById(id: string): Promise<any | null> {
    const result = await dbPool.query('SELECT * FROM docs WHERE id = $1 AND deleted_at IS NULL', [id]);
    return result.rows[0] || null;
  }

  async create(title: string, content: string, category: string | null, createdBy: string | null): Promise<any> {
    const result = await dbPool.query(
      'INSERT INTO docs (title, content, category, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, content, category, createdBy]
    );
    return result.rows[0];
  }

  async update(id: string, title: string, content: string, category: string | null): Promise<any | null> {
    const result = await dbPool.query(
      'UPDATE docs SET title = $1, content = $2, category = $3 WHERE id = $4 AND deleted_at IS NULL RETURNING *',
      [title, content, category, id]
    );
    return result.rows[0] || null;
  }
}
