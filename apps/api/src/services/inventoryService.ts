import { endpointRepository } from '../repositories/endpointRepository';
import { deploymentRepository } from '../repositories/deploymentRepository';
import { CustomError } from '../middleware/errorHandler';

export class InventoryService {
  async checkin(machineId: string, data: { hostname: string; ipAddress: string; osName: string; osVersion: string; osArch: string; software: any[]; hardware?: any }) {
    const updatePayload: any = {
      hostname: data.hostname,
      ipAddress: data.ipAddress,
      osName: data.osName,
      osVersion: data.osVersion,
      osArch: data.osArch,
      status: 'active'
    };
    
    if (data.hardware) {
      Object.assign(updatePayload, data.hardware);
    }

    const endpoint = await endpointRepository.update(machineId, updatePayload);

    if (data.software && data.software.length > 0) {
      await endpointRepository.upsertInstalledSoftware(endpoint.id, data.software);
    }

    const updatesNeeded = await endpointRepository.getUpdateSummary(machineId);

    return { endpoint, updatesNeeded };
  }

  async getEndpoints(page: number, limit: number) {
    return await endpointRepository.list(page, limit);
  }

  async getUpdateSummary(machineId: string) {
    return await endpointRepository.getUpdateSummary(machineId);
  }
  
  async getById(machineId: string) {
    const endpoint = await endpointRepository.findByMachineId(machineId);
    if (!endpoint) throw new CustomError('Endpoint not found', 404);
    
    const installed = await endpointRepository.getInstalledSoftware(endpoint.id);
    const updates = await endpointRepository.getUpdateSummary(machineId);
    
    return { endpoint, installed, updates };
  }

  async findByMachineId(machineId: string) {
    return await endpointRepository.findByMachineId(machineId);
  }

  async getInstalledSoftware(endpointId: string) {
    return await endpointRepository.getInstalledSoftware(endpointId);
  }

  async createDeployment(data: { endpointId: string, softwareId: string, requestedBy: string }) {
    return await deploymentRepository.create(data);
  }

  async decommission(id: string) {
    await endpointRepository.decommission(id);
  }
}

export const inventoryService = new InventoryService();
