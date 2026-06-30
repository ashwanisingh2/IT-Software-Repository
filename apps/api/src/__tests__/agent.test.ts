import { agentService } from '../services/agentService';

jest.mock('../repositories/enrollmentTokenRepository', () => ({
  enrollmentTokenRepository: {
    create: jest.fn().mockResolvedValue({ id: 'test', token: 'fake-token' }),
    findByToken: jest.fn().mockResolvedValue({ id: 'test', token: 'fake-token', revoked: false })
  }
}));

describe('Agent Service', () => {
  it('should generate an enrollment token', async () => {
    const result = await agentService.createEnrollmentToken('Test Label', 'admin');
    expect(result.token).toBeDefined();
    expect(result.downloadUrl).toContain(result.token);
  });

  it('should validate a token', async () => {
    const record = await agentService.validateToken('fake-token');
    expect(record).toBeDefined();
    expect(record.id).toBe('test');
  });
});
