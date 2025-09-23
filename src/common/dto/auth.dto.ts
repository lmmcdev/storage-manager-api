import { z } from 'zod';
import { UserRole, Permission } from '../interfaces/auth.interface';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(UserRole).optional().default(UserRole.USER),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required'),
  permissions: z
    .array(z.nativeEnum(Permission))
    .min(1, 'At least one permission is required'),
  expiresAt: z
    .string()
    .datetime()
    .transform((val) => new Date(val))
    .optional(),
});

export const updateApiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required').optional(),
  permissions: z
    .array(z.nativeEnum(Permission))
    .min(1, 'At least one permission is required')
    .optional(),
  isActive: z.boolean().optional(),
});

export const apiKeyParamsSchema = z.object({
  keyId: z.string().uuid('Invalid API key ID format'),
});

export const userParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type CreateApiKeyDto = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyDto = z.infer<typeof updateApiKeySchema>;
export type ApiKeyParamsDto = z.infer<typeof apiKeyParamsSchema>;
export type UserParamsDto = z.infer<typeof userParamsSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;