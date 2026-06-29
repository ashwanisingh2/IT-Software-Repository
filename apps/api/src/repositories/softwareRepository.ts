import { dbPool } from '../config/database';
import { Software, PaginatedData } from '@winrepo/shared';

export class SoftwareRepository {
  async findAll(page: number, pageSize: number, search?: string, category?: string): Promise<PaginatedData<Software>> {
    const offset = (page - 1) * pageSize;
    let countQuery = 'SELECT COUNT(*) FROM software WHERE deleted_at IS NULL';
    let dataQuery = 'SELECT * FROM software WHERE deleted_at IS NULL';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      countQuery += ` AND name ILIKE $${paramIndex}`;
      dataQuery += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      countQuery += ` AND category = $${paramIndex}`;
      dataQuery += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    dataQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    const countResult = await dbPool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);
    
    const dataParams = [...params, pageSize, offset];
    const dataResult = await dbPool.query(dataQuery, dataParams);

    return {
      items: dataResult.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<Software | null> {
    const result = await dbPool.query('SELECT * FROM software WHERE id = $1 AND deleted_at IS NULL', [id]);
    return result.rows[0] || null;
  }
  
  async findByName(name: string): Promise<Software | null> {
    const result = await dbPool.query('SELECT * FROM software WHERE name = $1 AND deleted_at IS NULL', [name]);
    return result.rows[0] || null;
  }

  async create(data: Omit<Software, 'id' | 'created_at' | 'updated_at' | 'download_count'>): Promise<Software> {
    const result = await dbPool.query(
      `INSERT INTO software (name, vendor, category, version, latest_version, sha256, file_size, storage_url, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [data.name, data.vendor, data.category, data.version, data.latest_version, data.sha256, data.file_size, data.storage_url, data.created_by]
    );
    return result.rows[0];
  }

  async update(id: string, data: Partial<Software>): Promise<Software | null> {
    const setFields = Object.keys(data).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(data);
    
    if (!setFields) return this.findById(id);

    const result = await dbPool.query(
      `UPDATE software SET ${setFields} WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await dbPool.query(
      'UPDATE software SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async addVersion(softwareId: string, version: string, sha256: string, fileSize: number, storageUrl: string, createdBy: string | null): Promise<any> {
    const result = await dbPool.query(
      `INSERT INTO software_versions (software_id, version, sha256, file_size, storage_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
       [softwareId, version, sha256, fileSize, storageUrl, createdBy]
    );
    return result.rows[0];
  }
  
  async getVersions(softwareId: string): Promise<any[]> {
     const result = await dbPool.query(
      'SELECT * FROM software_versions WHERE software_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [softwareId]
    );
    return result.rows;
  }
  
  async logDownload(softwareId: string, endpointId?: string, userId?: string, ipAddress?: string): Promise<void> {
    await dbPool.query(
      'INSERT INTO software_downloads (software_id, endpoint_id, user_id, ip_address) VALUES ($1, $2, $3, $4)',
      [softwareId, endpointId, userId, ipAddress]
    );
  }
}
