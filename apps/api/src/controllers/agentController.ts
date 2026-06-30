import { Request, Response, NextFunction } from 'express';
import { agentService } from '../services/agentService';
import { endpointRepository } from '../repositories/endpointRepository';
import { deploymentRepository } from '../repositories/deploymentRepository';
import { enrollmentTokenRepository } from '../repositories/enrollmentTokenRepository';
import { CustomError } from '../middleware/errorHandler';
import { z } from 'zod';

export const agentController = {
  // --- Admin Routes ---
  async createToken(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        label: z.string().min(1),
        maxUses: z.number().int().positive().optional(),
        expiresInDays: z.number().int().positive().optional()
      });
      const data = schema.parse(req.body);
      
      const result = await agentService.createEnrollmentToken(
        data.label,
        req.user!.id,
        data.maxUses,
        data.expiresInDays
      );
      
      res.status(201).json({ success: true, data: result });
    } catch (e: any) { next(e); }
  },

  async listTokens(req: Request, res: Response, next: NextFunction) {
    try {
      const tokens = await enrollmentTokenRepository.listActive();
      res.json({ success: true, data: tokens });
    } catch (e: any) { next(e); }
  },

  async revokeToken(req: Request, res: Response, next: NextFunction) {
    try {
      await enrollmentTokenRepository.revoke(req.params.id);
      res.json({ success: true, message: 'Token revoked successfully' });
    } catch (e: any) { next(e); }
  },

  // --- Public Agent Routes ---
  async downloadAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token as string;
      if (!token) throw new CustomError('Token required', 400);

      const script = await agentService.getAgentScript(token);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="WinRepoAgent.ps1"');
      res.send(script);
    } catch (e: any) {
      if (e instanceof CustomError) {
        res.status(e.statusCode).send(`Write-Error "${e.message}"`);
      } else {
        res.status(500).send('Write-Error "Internal Server Error"');
      }
    }
  },

  async registerAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        enrollmentToken: z.string(),
        machineId: z.string(),
        hostname: z.string(),
        ipAddress: z.string(),
        osName: z.string(),
        osVersion: z.string(),
        osArch: z.string()
      });
      const data = schema.parse(req.body);

      const result = await agentService.registerMachine(data);
      res.json({ success: true, data: result });
    } catch (e: any) { next(e); }
  },

  // --- Machine Authenticated Routes ---
  async getPendingDeployments(req: Request, res: Response, next: NextFunction) {
    try {
      const machineId = (req as any).machineId;
      const endpoint = await endpointRepository.findByMachineId(machineId);
      if (!endpoint) throw new CustomError('Endpoint not found', 404);

      const deployments = await deploymentRepository.findPendingByEndpoint(endpoint.id);
      res.json({ success: true, data: deployments });
    } catch (e: any) { next(e); }
  },

  async submitDeploymentResult(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        deploymentId: z.string().uuid(),
        status: z.enum(['completed', 'failed']),
        errorMessage: z.string().optional()
      });
      const data = schema.parse(req.body);
      
      await deploymentRepository.updateResult(data.deploymentId, data.status, data.errorMessage);
      res.json({ success: true });
    } catch (e: any) { next(e); }
  },

  async reportError(req: Request, res: Response, next: NextFunction) {
    try {
      // In a real app we would log this to audit_logs or a dedicated errors table
      console.error(`Agent Error [${(req as any).machineId}]:`, req.body);
      res.json({ success: true });
    } catch (e: any) { next(e); }
  },
  
  async reportPatchStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const machineId = (req as any).machineId;
      const { missingPatches } = req.body;
      const { query } = require('../config/database');

      const endpointRes = await query('SELECT id FROM endpoints WHERE machine_id = $1', [machineId]);
      if (!endpointRes.rows.length) return res.json({ success: false });
      const endpointId = endpointRes.rows[0].id;

      for (const patch of missingPatches || []) {
        const pRes = await query(
          `INSERT INTO patches (kb_article, title, description, severity) VALUES ($1, $2, $3, $4)
           ON CONFLICT (kb_article) DO UPDATE SET title = EXCLUDED.title RETURNING id`,
          [patch.kbArticle, patch.title, patch.description || '', patch.severity || 'Moderate']
        );
        const patchId = pRes.rows[0].id;
        
        await query(
          `INSERT INTO endpoint_patches (endpoint_id, patch_id, status) VALUES ($1, $2, 'missing')
           ON CONFLICT (endpoint_id, patch_id) DO NOTHING`,
          [endpointId, patchId]
        );
      }
      
      res.json({ success: true });
    } catch (e: any) { next(e); }
  },

  async getPendingScripts(req: Request, res: Response, next: NextFunction) {
    try {
      const machineId = (req as any).machineId;
      const { scriptService } = require('../services/scriptService');
      const scripts = await scriptService.getPendingExecutions(machineId);
      res.json({ success: true, data: scripts });
    } catch (e: any) { next(e); }
  },

  async submitScriptResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { executionId, status, exitCode, stdout, stderr } = req.body;
      const { scriptService } = require('../services/scriptService');
      await scriptService.reportExecutionResult(executionId, status, exitCode || 0, stdout || '', stderr || '');
      res.json({ success: true });
    } catch (e: any) { next(e); }
  },

  async getPendingPolicies(req: Request, res: Response, next: NextFunction) {
    try {
      const machineId = (req as any).machineId;
      const { query } = require('../config/database');
      
      const policies = await query('SELECT * FROM configuration_policies ORDER BY created_at DESC');
      res.json({ success: true, data: policies.rows });
    } catch (e: any) { next(e); }
  },

  async reportSecurityStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const machineId = (req as any).machineId;
      const { bitlockerStatus, firewallEnabled, avStatus, usbStorageEnabled } = req.body;
      const { endpointRepository } = require('../repositories/endpointRepository');
      
      await endpointRepository.update(machineId, {
        bitlockerStatus,
        firewallEnabled,
        avStatus,
        usbStorageEnabled
      } as any);
      
      res.json({ success: true });
    } catch (e: any) { next(e); }
  },
  
  async getUninstallScript(req: Request, res: Response, next: NextFunction) {
    try {
      const { agentService } = require('../services/agentService');
      const script = await agentService.getUninstallScript();
      res.setHeader('Content-Type', 'text/plain');
      res.send(script);
    } catch (e: any) { next(e); }
  },
  
  async getInstallScript(req: Request, res: Response, next: NextFunction) {
    try {
      const path = require('path');
      const fs = require('fs');
      const scriptPath = path.resolve(__dirname, '../../../../scripts/agent-template/WinRepoAgent.ps1.template');
      if (fs.existsSync(scriptPath)) {
        res.setHeader('Content-Type', 'text/plain');
        res.send(fs.readFileSync(scriptPath, 'utf8'));
      } else {
        res.status(404).send('Agent template not found');
      }
    } catch (e: any) { next(e); }
  }
};
