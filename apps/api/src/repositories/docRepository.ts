import { query } from '../config/database';
import { Doc, PaginatedResponse, DocCategory } from '@winrepo/shared';

export class DocRepository {
  async findById(id: string): Promise<Doc | null> {
    const res = await query('SELECT *, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt" FROM docs WHERE id = $1 AND deleted_at IS NULL', [id]);
    return res.rows[0] || null;
  }

  async list(filters: { category?: DocCategory; search?: string; tags?: string[] }, page: number, limit: number): Promise<PaginatedResponse<Doc>> {
    let where = 'WHERE deleted_at IS NULL';
    const params: any[] = [];
    let paramCount = 1;

    if (filters.category) {
      where += ` AND category = $${paramCount++}`;
      params.push(filters.category);
    }
    if (filters.search) {
      where += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }
    if (filters.tags && filters.tags.length > 0) {
      where += ` AND tags @> $${paramCount++}`;
      params.push(filters.tags);
    }

    const offset = (page - 1) * limit;
    const countRes = await query(`SELECT COUNT(*) FROM docs ${where}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const res = await query(
      `SELECT *, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt" FROM docs ${where} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    return {
      success: true,
      data: res.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async create(data: { title: string; content: string; category: DocCategory; tags: string[]; createdBy: string }): Promise<Doc> {
    const res = await query(
      `INSERT INTO docs (title, content, category, tags, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt"`,
      [data.title, data.content, data.category, data.tags, data.createdBy]
    );
    return res.rows[0];
  }

  async update(id: string, data: Partial<{ title: string; content: string; category: DocCategory; tags: string[] }>): Promise<Doc> {
    const keys = Object.keys(data);
    if (!keys.length) throw new Error('No data to update');
    
    const params = keys.map(k => (data as any)[k]);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    
    params.push(id);
    const res = await query(
      `UPDATE docs SET ${sets} WHERE id = $${params.length} AND deleted_at IS NULL RETURNING *, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt"`,
      params
    );
    return res.rows[0];
  }

  async softDelete(id: string): Promise<void> {
    await query('UPDATE docs SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL', [id]);
  }
}

export const docRepository = new DocRepository();
