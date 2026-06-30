import { query, getClient } from '../config/database';
import { Endpoint, InstalledSoftware, PaginatedResponse } from '@winrepo/shared';

export class EndpointRepository {
  private formatRow(row: any): Endpoint {
    return {
      id: row.id,
      machineId: row.machine_id,
      hostname: row.hostname,
      ipAddress: row.ip_address,
      osName: row.os_name,
      osVersion: row.os_version,
      osArch: row.os_arch,
      enrollmentTokenId: row.enrollment_token_id,
      agentVersion: row.agent_version,
      apiKeyHash: row.api_key_hash,
      status: row.status,
      lastCheckin: row.last_checkin,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async findByMachineId(machineId: string): Promise<Endpoint | null> {
    const res = await query('SELECT * FROM endpoints WHERE machine_id = $1', [machineId]);
    return res.rows[0] ? this.formatRow(res.rows[0]) : null;
  }

  async create(data: { machineId: string, hostname: string, ipAddress: string, osName: string, osVersion: string, osArch: string, status: string, enrollmentTokenId?: string, apiKeyHash?: string }): Promise<Endpoint> {
    const res = await query(
      `INSERT INTO endpoints (machine_id, hostname, ip_address, os_name, os_version, os_arch, status, enrollment_token_id, api_key_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [data.machineId, data.hostname, data.ipAddress, data.osName, data.osVersion, data.osArch, data.status, data.enrollmentTokenId, data.apiKeyHash]
    );
    return this.formatRow(res.rows[0]);
  }

  async update(machineId: string, data: Partial<{ hostname: string, ipAddress: string, osName: string, osVersion: string, osArch: string, status: string, agentVersion: string, apiKeyHash: string }>): Promise<Endpoint> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        // Map JS camelCase keys to snake_case DB columns
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        updates.push(`${dbKey} = $${idx}`);
        values.push(val);
        idx++;
      }
    }
    
    updates.push(`last_checkin = NOW()`);

    values.push(machineId);
    
    const res = await query(
      `UPDATE endpoints SET ${updates.join(', ')} WHERE machine_id = $${idx} RETURNING *`,
      values
    );
    
    return this.formatRow(res.rows[0]);
  }

  async list(page: number, limit: number): Promise<PaginatedResponse<Endpoint>> {
    const offset = (page - 1) * limit;
    const countRes = await query("SELECT COUNT(*) FROM endpoints WHERE status != 'decommissioned'");
    const total = parseInt(countRes.rows[0].count, 10);

    const res = await query(
      "SELECT * FROM endpoints WHERE status != 'decommissioned' ORDER BY last_checkin DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    return {
      success: true,
      data: res.rows.map(this.formatRow),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async decommission(id: string): Promise<void> {
    await query("UPDATE endpoints SET status = 'decommissioned' WHERE id = $1", [id]);
  }

  async getInstalledSoftware(endpointId: string): Promise<InstalledSoftware[]> {
    const res = await query('SELECT *, endpoint_id as "endpointId", software_id as "softwareId", installed_at as "installedAt", updated_at as "updatedAt" FROM installed_software WHERE endpoint_id = $1', [endpointId]);
    return res.rows;
  }

  async upsertInstalledSoftware(endpointId: string, software: { name: string; version: string; vendor: string }[]): Promise<void> {
    const { client, release } = await getClient();
    try {
      await client.query('BEGIN');
      for (const item of software) {
        await client.query(
          `INSERT INTO installed_software (endpoint_id, name, version, vendor)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (endpoint_id, name) DO UPDATE SET
           version = EXCLUDED.version, vendor = EXCLUDED.vendor`,
          [endpointId, item.name, item.version, item.vendor]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      release();
    }
  }

  async getUpdateSummary(machineId: string): Promise<{ software_name: string; installed_version: string; latest_version: string }[]> {
    const res = await query('SELECT * FROM get_endpoint_update_summary($1)', [machineId]);
    return res.rows;
  }
}

export const endpointRepository = new EndpointRepository();
