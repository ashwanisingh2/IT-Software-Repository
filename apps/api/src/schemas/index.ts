import { z } from 'zod';

export const endpointCheckinSchema = z.object({
  hostname: z.string().min(1),
  ipAddress: z.string().ip(),
  osName: z.string(),
  osVersion: z.string(),
  osArch: z.string(),
  software: z.array(
    z.object({
      name: z.string(),
      version: z.string(),
      vendor: z.string()
    })
  ).optional()
});
