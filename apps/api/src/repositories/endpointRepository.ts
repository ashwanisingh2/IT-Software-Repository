import { query, getClient } from '../config/database';
import { Endpoint, InstalledSoftware, PaginatedResponse } from '@winrepo/shared';

export class EndpointRepository {
  async findByMachineId(machineId: string): Promise<Endpoint | null> {
    const res = await query('SELECT *, machine_id as "machineId", ip_address as "ipAddress", os_name as "osName", os_version as "osVersion", os_arch as "osArch", last_checkin as "lastCheckin", created_at as "createdAt", updated_at as "updatedAt" FROM endpoints WHERE machine_id = $1', [machineId]);
    return res.rows[0] || null;
  }

  async upsert(data: { machineId: string; hostname: string; ipAddress: string; osName: string; osVersion: string; osArch: string }): Promise<Endpoint> {
    const res = await query(
      `INSERT INTO endpoints (machine_id, hostname, ip_address, os_name, os_version, os_arch, last_checkin)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (machine_id) DO UPDATE SET
       hostname = EXCLUDED.hostname, ip_address = EXCLUDED.ip_address, os_name = EXCLUDED.os_name, 
       os_version = EXCLUDED.os_version, os_arch = EXCLUDED.os_arch, last_checkin = NOW()
       RETURNING *, machine_id as "machineId", ip_address as "ipAddress", os_name as "osName", os_version as "osVersion", os_arch as "osArch", last_checkin as "lastCheckin", created_at as "createdAt", updated_at as "updatedAt"`,
      [data.machineId, data.hostname, data.ipAddress, data.osName, data.osVersion, data.osArch]
    );
    return res.rows[0];
  }

  async list(page: number, limit: number): Promise<PaginatedResponse<Endpoint>> {
    const offset = (page - 1) * limit;
    const countRes = await query('SELECT COUNT(*) FROM endpoints');
    const total = parseInt(countRes.rows[0].count, 10);

    const res = await query(
      'SELECT *, machine_id as "machineId", ip_address as "ipAddress", os_name as "osName", os_version as "osVersion", os_arch as "osArch", last_checkin as "lastCheckin", created_at as "createdAt", updated_at as "updatedAt" FROM endpoints ORDER BY last_checkin DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return {
      success: true,
      data: res.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
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
      // Note: we can optionally delete installed_software that was not in the payload
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
