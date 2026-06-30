import { DeploymentRequest } from '@winrepo/shared';
import { db } from '../config/database';

export const deploymentRepository = {
  async create(data: { endpointId: string, softwareId: string, requestedBy: string }): Promise<DeploymentRequest> {
    const result = await db.query(
      `INSERT INTO deployment_requests (endpoint_id, software_id, requested_by, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [data.endpointId, data.softwareId, data.requestedBy]
    );
    return result.rows[0];
  },

  async findPendingByEndpoint(endpointId: string): Promise<DeploymentRequest[]> {
    const result = await db.query(
      `SELECT d.*, s.name as "softwareName", s.latest_version as "version", s.silent_install_args as "silentInstallArgs"
       FROM deployment_requests d
       JOIN software s ON d.software_id = s.id
       WHERE d.endpoint_id = $1 AND d.status = 'pending'`,
      [endpointId]
    );
    return result.rows;
  },

  async updateResult(id: string, status: string, errorMessage?: string): Promise<void> {
    await db.query(
      `UPDATE deployment_requests SET status = $1, error_message = $2, completed_at = NOW()
       WHERE id = $3`,
      [status, errorMessage || null, id]
    );
  }
};
