import { query } from '../config/database';
import { Software, SoftwareVersion, PaginatedResponse, SoftwareCategory, SoftwareStatus } from '@winrepo/shared';

export class SoftwareRepository {
  async findById(id: string): Promise<Software | null> {
    const res = await query('SELECT *, created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt", latest_version as "latestVersion", file_size as "fileSize", storage_url as "storageUrl", download_count as "downloadCount", created_by as "createdBy" FROM software WHERE id = $1 AND deleted_at IS NULL', [id]);
    return res.rows[0] || null;
  }

  async findByName(name: string): Promise<Software | null> {
    const res = await query('SELECT *, created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt", latest_version as "latestVersion", file_size as "fileSize", storage_url as "storageUrl", download_count as "downloadCount", created_by as "createdBy" FROM software WHERE name = $1 AND deleted_at IS NULL', [name]);
    return res.rows[0] || null;
  }

  async list(filters: { category?: SoftwareCategory; status?: SoftwareStatus; search?: string }, page: number, limit: number): Promise<PaginatedResponse<Software>> {
    let where = 'WHERE deleted_at IS NULL';
    const params: any[] = [];
    let paramCount = 1;

    if (filters.category) {
      where += ` AND category = $${paramCount++}`;
      params.push(filters.category);
    }
    if (filters.status) {
      where += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    }
    if (filters.search) {
      where += ` AND (name ILIKE $${paramCount} OR vendor ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    const offset = (page - 1) * limit;
    const countQuery = `SELECT COUNT(*) FROM software ${where}`;
    const dataQuery = `SELECT *, created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt", latest_version as "latestVersion", file_size as "fileSize", storage_url as "storageUrl", download_count as "downloadCount", created_by as "createdBy" FROM software ${where} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    
    params.push(limit, offset);

    const countRes = await query(countQuery, params.slice(0, -2));
    const total = parseInt(countRes.rows[0].count, 10);
    const res = await query(dataQuery, params);

    return {
      success: true,
      data: res.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async create(data: { name: string; vendor: string; description?: string; category: SoftwareCategory; createdBy: string; version: string; sha256: string; fileSize: number; storageUrl: string }): Promise<Software> {
    const res = await query(
      `INSERT INTO software (name, vendor, description, category, latest_version, sha256, file_size, storage_url, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *, created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt", latest_version as "latestVersion", file_size as "fileSize", storage_url as "storageUrl", download_count as "downloadCount", created_by as "createdBy"`,
      [data.name, data.vendor, data.description || '', data.category, data.version, data.sha256, data.fileSize, data.storageUrl, data.createdBy]
    );
    return res.rows[0];
  }

  async update(id: string, data: Partial<{ name: string; vendor: string; description: string; category: SoftwareCategory; status: SoftwareStatus }>): Promise<Software> {
    const keys = Object.keys(data);
    const params = keys.map(k => (data as any)[k]);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    
    if (!keys.length) throw new Error('No data to update');
    
    params.push(id);
    const res = await query(
      `UPDATE software SET ${sets} WHERE id = $${params.length} AND deleted_at IS NULL RETURNING *, created_at as "createdAt", updated_at as "updatedAt", deleted_at as "deletedAt", latest_version as "latestVersion", file_size as "fileSize", storage_url as "storageUrl", download_count as "downloadCount", created_by as "createdBy"`,
      params
    );
    return res.rows[0];
  }

  async softDelete(id: string): Promise<void> {
    await query('UPDATE software SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL', [id]);
  }

  async incrementDownload(id: string): Promise<void> {
    query('UPDATE software SET download_count = download_count + 1 WHERE id = $1', [id]).catch(() => {});
  }

  async getVersions(softwareId: string): Promise<SoftwareVersion[]> {
    const res = await query('SELECT *, software_id as "softwareId", file_size as "fileSize", storage_url as "storageUrl", release_notes as "releaseNotes", is_latest as "isLatest", created_at as "createdAt" FROM software_versions WHERE software_id = $1 ORDER BY created_at DESC', [softwareId]);
    return res.rows;
  }

  async addVersion(softwareId: string, data: { version: string; sha256: string; fileSize: number; storageUrl: string; releaseNotes?: string }): Promise<SoftwareVersion> {
    const res = await query(
      `INSERT INTO software_versions (software_id, version, sha256, file_size, storage_url, release_notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *, software_id as "softwareId", file_size as "fileSize", storage_url as "storageUrl", release_notes as "releaseNotes", is_latest as "isLatest", created_at as "createdAt"`,
      [softwareId, data.version, data.sha256, data.fileSize, data.storageUrl, data.releaseNotes || '']
    );
    return res.rows[0];
  }

  async getMostDownloaded(limit: number): Promise<Software[]> {
    const res = await query('SELECT *, latest_version as "latestVersion", file_size as "fileSize", storage_url as "storageUrl", download_count as "downloadCount", created_by as "createdBy" FROM software WHERE deleted_at IS NULL ORDER BY download_count DESC LIMIT $1', [limit]);
    return res.rows;
  }

  async getRecentUploads(limit: number): Promise<Software[]> {
    const res = await query('SELECT *, latest_version as "latestVersion", file_size as "fileSize", storage_url as "storageUrl", download_count as "downloadCount", created_by as "createdBy" FROM software WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1', [limit]);
    return res.rows;
  }
}

export const softwareRepository = new SoftwareRepository();
