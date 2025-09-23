import { z } from 'zod';

export const healthStatusSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.string().datetime(),
  version: z.string(),
  environment: z.string(),
  services: z.object({
    storage: z.object({
      status: z.enum(['healthy', 'unhealthy']),
      message: z.string().optional(),
    }),
  }),
  uptime: z.number(),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;