import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiKey,
  ApiKeyCreate,
  ApiKeyResult,
  Permission,
  User
} from '../interfaces/auth.interface';

export class ApiKeyService {
  private readonly apiKeys: Map<string, ApiKey> = new Map();
  private readonly keyHashSaltRounds = 12;

  generateApiKey(): string {
    const prefix = 'sk-';
    const randomPart = Buffer.from(uuidv4().replace(/-/g, '')).toString('base64').slice(0, 32);
    return `${prefix}${randomPart}`;
  }

  async createApiKey(
    userId: string,
    keyData: ApiKeyCreate
  ): Promise<ApiKeyResult> {
    const keyValue = this.generateApiKey();
    const keyHash = await bcrypt.hash(keyValue, this.keyHashSaltRounds);

    const apiKey: ApiKey = {
      id: uuidv4(),
      name: keyData.name,
      keyHash,
      userId,
      permissions: keyData.permissions,
      isActive: true,
      expiresAt: keyData.expiresAt,
      createdAt: new Date(),
    };

    this.apiKeys.set(apiKey.id, apiKey);

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: keyValue,
      permissions: apiKey.permissions,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  async validateApiKey(keyValue: string): Promise<ApiKey | null> {
    if (!keyValue || !keyValue.startsWith('sk-')) {
      return null;
    }

    for (const apiKey of this.apiKeys.values()) {
      if (!apiKey.isActive) {
        continue;
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        continue;
      }

      const isValid = await bcrypt.compare(keyValue, apiKey.keyHash);
      if (isValid) {
        await this.updateLastUsed(apiKey.id);
        return apiKey;
      }
    }

    return null;
  }

  async updateLastUsed(keyId: string): Promise<void> {
    const apiKey = this.apiKeys.get(keyId);
    if (apiKey) {
      apiKey.lastUsedAt = new Date();
      this.apiKeys.set(keyId, apiKey);
    }
  }

  async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey || apiKey.userId !== userId) {
      return false;
    }

    apiKey.isActive = false;
    this.apiKeys.set(keyId, apiKey);
    return true;
  }

  async getUserApiKeys(userId: string): Promise<Omit<ApiKey, 'keyHash'>[]> {
    const userKeys: Omit<ApiKey, 'keyHash'>[] = [];

    for (const apiKey of this.apiKeys.values()) {
      if (apiKey.userId === userId) {
        const { keyHash, ...keyWithoutHash } = apiKey;
        userKeys.push(keyWithoutHash);
      }
    }

    return userKeys.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateApiKey(
    keyId: string,
    userId: string,
    updates: Partial<Pick<ApiKey, 'name' | 'permissions' | 'isActive'>>
  ): Promise<boolean> {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey || apiKey.userId !== userId) {
      return false;
    }

    if (updates.name !== undefined) {
      apiKey.name = updates.name;
    }
    if (updates.permissions !== undefined) {
      apiKey.permissions = updates.permissions;
    }
    if (updates.isActive !== undefined) {
      apiKey.isActive = updates.isActive;
    }

    this.apiKeys.set(keyId, apiKey);
    return true;
  }

  hasPermission(apiKey: ApiKey, permission: Permission): boolean {
    return apiKey.permissions.includes(permission);
  }

  hasAnyPermission(apiKey: ApiKey, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(apiKey, permission));
  }

  hasAllPermissions(apiKey: ApiKey, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(apiKey, permission));
  }

  getPermissionsForEndpoint(endpoint: string, method: string): Permission[] {
    const endpointPermissions: Record<string, Record<string, Permission[]>> = {
      '/files': {
        'GET': [Permission.FILES_LIST],
        'POST': [Permission.FILES_WRITE],
      },
      '/files/download': {
        'GET': [Permission.FILES_READ],
      },
      '/files/upload': {
        'POST': [Permission.FILES_WRITE],
      },
      '/files/copy': {
        'POST': [Permission.FILES_COPY],
      },
      '/files/sas': {
        'GET': [Permission.FILES_SAS],
      },
      '*': {
        'DELETE': [Permission.FILES_DELETE],
      }
    };

    const methodPermissions = endpointPermissions[endpoint]?.[method.toUpperCase()];
    if (methodPermissions) {
      return methodPermissions;
    }

    const wildcardPermissions = endpointPermissions['*']?.[method.toUpperCase()];
    return wildcardPermissions || [];
  }

  async seedDefaultApiKeys(): Promise<void> {
    const devApiKey = await this.createApiKey('system', {
      name: 'Development Key',
      permissions: Object.values(Permission),
    });

    console.log('Default API key created:', {
      name: devApiKey.name,
      key: devApiKey.key,
      permissions: devApiKey.permissions.length,
    });
  }
}