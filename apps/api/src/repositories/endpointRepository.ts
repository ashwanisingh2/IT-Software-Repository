import { dbPool } from '../config/database';
import { Endpoint } from '@winrepo/shared';

export class EndpointRepository {
  async upsert(machineId: string, hostname: string, osVersion: string | null, ipAddress: string | null, installedSoftware: any): Promise<Endpoint> {
    const result = await dbPool.query(
      `INSERT INTO endpoints (machine_id, hostname, os_version, ip_address, installed_software, last_checkin)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (machine_id) DO UPDATE SET 
         hostname = EXCLUDED.hostname,
         os_version = EXCLUDED.os_version,
         ip_address = EXCLUDED.ip_address,
         installed_software = EXCLUDED.installed_software,
         last_checkin = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [machineId, hostname, osVersion, ipAddress, installedSoftware]
    );
    return result.rows[0];
  }
  
  async syncInstalledSoftware(endpointId: string, softwareList: { name: string, version: string }[]): Promise<void> {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete old tracking for this endpoint
      await client.query('DELETE FROM installed_software WHERE endpoint_id = $1', [endpointId]);
      
      // Insert new tracking
      if (softwareList.length > 0) {
        const values = softwareList.map(s => `('${endpointId}', '${s.name}', '${s.version}', CURRENT_TIMESTAMP)`).join(',');
        await client.query(`INSERT INTO installed_software (endpoint_id, software_name, installed_version, install_date) VALUES ${values}`);
      }
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async findAll(): Promise<Endpoint[]> {
    const result = await dbPool.query('SELECT * FROM endpoints WHERE deleted_at IS NULL ORDER BY last_checkin DESC');
    return result.rows;
  }

  async findByMachineId(machineId: string): Promise<Endpoint | null> {
    const result = await dbPool.query('SELECT * FROM endpoints WHERE machine_id = $1 AND deleted_at IS NULL', [machineId]);
    return result.rows[0] || null;
  }
}
