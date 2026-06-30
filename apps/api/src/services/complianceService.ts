import { query } from '../config/database';
import { endpointRepository } from '../repositories/endpointRepository';

export class ComplianceService {
  async evaluateAllEndpoints() {
    const endpointsRes = await query('SELECT * FROM endpoints WHERE status != $1', ['decommissioned']);
    const policiesRes = await query('SELECT * FROM compliance_policies');
    const policies = policiesRes.rows;
    
    let compliantCount = 0;
    let nonCompliantCount = 0;

    for (const ep of endpointsRes.rows) {
      let isCompliant = true;
      const reasons: string[] = [];

      for (const policy of policies) {
        const rule = policy.rule_condition;
        
        if (policy.rule_type === 'bitlocker') {
          if (rule.require_enabled && ep.bitlocker_status !== 'FullyEncrypted') {
            isCompliant = false;
            reasons.push('BitLocker is not fully encrypted');
          }
        }
        
        if (policy.rule_type === 'av') {
          if (rule.require_running && (!ep.av_status || ep.av_status === 'None detected')) {
            isCompliant = false;
            reasons.push('AntiVirus is missing or not running');
          }
        }
        
        if (policy.rule_type === 'firewall') {
          if (rule.require_enabled && ep.firewall_enabled !== true) {
            isCompliant = false;
            reasons.push('Windows Firewall is disabled');
          }
        }
      }

      // 🔴 We could save this to a new `endpoint_compliance` table.
      // For now, we just tally them up to return a quick report.
      if (isCompliant) compliantCount++;
      else nonCompliantCount++;
    }

    return { total: endpointsRes.rowCount, compliantCount, nonCompliantCount };
  }
}

export const complianceService = new ComplianceService();
