import { endpointRepository } from '../repositories/endpointRepository';

export class InventoryService {
  async checkin(machineId: string, data: { hostname: string; ipAddress: string; osName: string; osVersion: string; osArch: string; installedSoftware: any[] }) {
    const endpoint = await endpointRepository.upsert({
      machineId,
      hostname: data.hostname,
      ipAddress: data.ipAddress,
      osName: data.osName,
      osVersion: data.osVersion,
      osArch: data.osArch
    });

    if (data.installedSoftware && data.installedSoftware.length > 0) {
      await endpointRepository.upsertInstalledSoftware(endpoint.id, data.installedSoftware);
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
    if (!endpoint) throw { status: 404, code: 'NOT_FOUND', message: 'Endpoint not found' };
    
    const installed = await endpointRepository.getInstalledSoftware(endpoint.id);
    const updates = await endpointRepository.getUpdateSummary(machineId);
    
    return { endpoint, installed, updates };
  }
}

export const inventoryService = new InventoryService();
