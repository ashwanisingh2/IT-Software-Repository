import crypto from 'crypto';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { enrollmentTokenRepository } from '../repositories/enrollmentTokenRepository';
import { endpointRepository } from '../repositories/endpointRepository';
import { deploymentRepository } from '../repositories/deploymentRepository';
import { CustomError } from '../middleware/errorHandler';

export const agentService = {
  async createEnrollmentToken(label: string, createdBy: string, maxUses?: number, expiresInDays?: number) {
    const token = crypto.randomBytes(32).toString('hex');
    let expiresAt = null;
    if (expiresInDays) {
      const date = new Date();
      date.setDate(date.getDate() + expiresInDays);
      expiresAt = date.toISOString();
    }

    const record = await enrollmentTokenRepository.create({
      token,
      label,
      createdBy,
      maxUses: maxUses || null,
      expiresAt
    });

    const apiUrl = process.env.API_URL || 'http://localhost/api';
    return {
      token,
      downloadUrl: `${apiUrl}/agent/download?token=${token}`,
      installCommand: `irm "${apiUrl}/agent/download?token=${token}" | iex`
    };
  },

  async validateToken(token: string) {
    const record = await enrollmentTokenRepository.findByToken(token);
    if (!record) throw new CustomError('Invalid enrollment token', 403);
    if (record.revoked) throw new CustomError('Enrollment token has been revoked', 403);
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      throw new CustomError('Enrollment token has expired', 403);
    }
    if (record.maxUses && record.useCount >= record.maxUses) {
      throw new CustomError('Enrollment token has reached maximum uses', 403);
    }
    return record;
  },

  async getAgentScript(token: string) {
    await this.validateToken(token); // Just check it's valid
    
    // Read the template
    const templatePath = path.resolve(__dirname, '../../../../scripts/agent-template/WinRepoAgent.ps1.template');
    if (!fs.existsSync(templatePath)) {
      throw new CustomError('Agent template not found on server', 500);
    }
    
    let script = fs.readFileSync(templatePath, 'utf8');
    const apiUrl = process.env.API_URL || 'http://localhost/api';
    
    script = script.replace('{{API_URL}}', apiUrl);
    script = script.replace('{{ENROLLMENT_TOKEN}}', token);
    
    return script;
  },

  async getUninstallScript() {
    const templatePath = path.resolve(__dirname, '../../../../scripts/agent-template/WinRepoAgentUninstall.ps1.template');
    if (!fs.existsSync(templatePath)) {
      throw new CustomError('Uninstall template not found on server', 500);
    }
    let script = fs.readFileSync(templatePath, 'utf8');
    const apiUrl = process.env.API_URL || 'http://localhost/api';
    script = script.replace('{{API_URL}}', apiUrl);
    return script;
  },

  async registerMachine(data: { enrollmentToken: string, machineId: string, hostname: string, ipAddress: string, osName: string, osVersion: string, osArch: string }) {
    const tokenRecord = await this.validateToken(data.enrollmentToken);
    
    // Increment usage
    await enrollmentTokenRepository.incrementUsage(tokenRecord.id);

    // Generate machine API key
    const machineApiKeyPlain = crypto.randomBytes(32).toString('hex');
    const machineApiKeyHash = await bcrypt.hash(machineApiKeyPlain, 10);

    // Upsert endpoint
    let endpoint = await endpointRepository.findByMachineId(data.machineId);
    if (endpoint) {
      await endpointRepository.update(data.machineId, {
        hostname: data.hostname,
        ipAddress: data.ipAddress,
        osName: data.osName,
        osVersion: data.osVersion,
        osArch: data.osArch,
        status: 'active',
        apiKeyHash: machineApiKeyHash
      });
    } else {
      endpoint = await endpointRepository.create({
        machineId: data.machineId,
        hostname: data.hostname,
        ipAddress: data.ipAddress,
        osName: data.osName,
        osVersion: data.osVersion,
        osArch: data.osArch,
        status: 'active',
        enrollmentTokenId: tokenRecord.id,
        apiKeyHash: machineApiKeyHash
      });
    }

    return { apiKey: machineApiKeyPlain };
  }
};
