import { query } from '../config/database';

export class ScriptService {
  async listScripts() {
    const res = await query('SELECT * FROM scripts ORDER BY created_at DESC');
    return res.rows;
  }

  async createScript(data: { name: string, description: string, scriptType: string, content: string, createdBy: string }) {
    const res = await query(
      `INSERT INTO scripts (name, description, script_type, content, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.name, data.description, data.scriptType, data.content, data.createdBy]
    );
    return res.rows[0];
  }

  async executeScript(scriptId: string, endpointId: string, executedBy: string) {
    const res = await query(
      `INSERT INTO script_executions (script_id, endpoint_id, executed_by, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [scriptId, endpointId, executedBy]
    );
    return res.rows[0];
  }

  async getPendingExecutions(machineId: string) {
    const res = await query(
      `SELECT se.id as execution_id, s.script_type, s.content, s.name
       FROM script_executions se
       JOIN scripts s ON se.script_id = s.id
       JOIN endpoints e ON se.endpoint_id = e.id
       WHERE e.machine_id = $1 AND se.status = 'pending'`,
      [machineId]
    );
    return res.rows;
  }

  async reportExecutionResult(executionId: string, status: string, exitCode: number, stdout: string, stderr: string) {
    await query(
      `UPDATE script_executions 
       SET status = $1, exit_code = $2, stdout = $3, stderr = $4, completed_at = NOW()
       WHERE id = $5`,
      [status, exitCode, stdout, stderr, executionId]
    );
  }
}

export const scriptService = new ScriptService();
