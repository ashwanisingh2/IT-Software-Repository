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
  
  async getUninstallScript(req: Request, res: Response, next: NextFunction) {
    try {
      const script = await agentService.getUninstallScript();
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="WinRepoAgentUninstall.ps1"');
      res.send(script);
    } catch (e: any) { next(e); }
  }
};
