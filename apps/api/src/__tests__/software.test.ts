import { softwareService } from '../services/softwareService';

jest.mock('../repositories/softwareRepository', () => ({
  softwareRepository: {
    findById: jest.fn().mockResolvedValue({ id: 'sw1', name: 'Test App' })
  }
}));

describe('Software Service', () => {
  it('should get software by id', async () => {
    const result = await softwareService.getById('sw1');
    expect(result.name).toBe('Test App');
  });
});
