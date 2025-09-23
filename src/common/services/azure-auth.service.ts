import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { env } from '../config/env';
import { Permission, UserRole, AuthContext } from '../interfaces/auth.interface';

export interface AzureAuthConfig {
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface AzureTokenPayload {
  oid: string; // Object ID
  tid: string; // Tenant ID
  aud: string; // Audience
  iss: string; // Issuer
  roles?: string[]; // App roles
  scp?: string; // Scopes
  appid?: string; // Application ID
  exp: number; // Expiration
  iat: number; // Issued at
}

export class AzureAuthService {
  private credential: DefaultAzureCredential | ClientSecretCredential;
  private graphClient?: Client;

  constructor(config?: AzureAuthConfig) {
    if (config?.tenantId && config?.clientId && config?.clientSecret) {
      this.credential = new ClientSecretCredential(
        config.tenantId,
        config.clientId,
        config.clientSecret
      );
    } else {
      this.credential = new DefaultAzureCredential();
    }

    this.initializeGraphClient();
  }

  private initializeGraphClient(): void {
    try {
      const authProvider = new TokenCredentialAuthenticationProvider(
        this.credential,
        { scopes: ['https://graph.microsoft.com/.default'] }
      );

      this.graphClient = Client.initWithMiddleware({
        authProvider,
      });
    } catch (error) {
      console.warn('Failed to initialize Microsoft Graph client:', error);
    }
  }

  async validateAccessToken(token: string): Promise<AzureTokenPayload | null> {
    try {
      const payload = this.decodeTokenPayload(token);

      if (!payload) {
        return null;
      }

      if (payload.exp < Date.now() / 1000) {
        console.warn('Token has expired');
        return null;
      }

      const expectedAudience = env.AZURE_CLIENT_ID || env.AZURE_APP_ID;
      if (expectedAudience && payload.aud !== expectedAudience) {
        console.warn('Token audience mismatch');
        return null;
      }

      return payload;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  private decodeTokenPayload(token: string): AzureTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf8')
      );

      return payload as AzureTokenPayload;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  async getServicePrincipalInfo(objectId: string): Promise<any> {
    if (!this.graphClient) {
      throw new Error('Microsoft Graph client not available');
    }

    try {
      const servicePrincipal = await this.graphClient
        .api(`/servicePrincipals/${objectId}`)
        .get();

      return servicePrincipal;
    } catch (error) {
      console.error('Failed to get service principal info:', error);
      return null;
    }
  }

  async getApplicationRoles(appId: string): Promise<string[]> {
    if (!this.graphClient) {
      return [];
    }

    try {
      const application = await this.graphClient
        .api(`/applications`)
        .filter(`appId eq '${appId}'`)
        .get();

      if (application.value && application.value.length > 0) {
        return application.value[0].appRoles?.map((role: any) => role.value) || [];
      }

      return [];
    } catch (error) {
      console.error('Failed to get application roles:', error);
      return [];
    }
  }

  mapAzureRolesToPermissions(azureRoles: string[]): Permission[] {
    const rolePermissionMap: Record<string, Permission[]> = {
      'Files.Read': [Permission.FILES_READ, Permission.FILES_LIST],
      'Files.Write': [Permission.FILES_WRITE, Permission.FILES_READ, Permission.FILES_LIST],
      'Files.Delete': [Permission.FILES_DELETE],
      'Files.Copy': [Permission.FILES_COPY],
      'Files.SAS': [Permission.FILES_SAS],
      'Files.Admin': Object.values(Permission),
      'Storage.Admin': Object.values(Permission),
    };

    const permissions = new Set<Permission>();

    for (const role of azureRoles) {
      const rolePermissions = rolePermissionMap[role];
      if (rolePermissions) {
        rolePermissions.forEach(permission => permissions.add(permission));
      }
    }

    return Array.from(permissions);
  }

  mapAzureRoleToUserRole(azureRoles: string[]): UserRole {
    if (azureRoles.includes('Storage.Admin') || azureRoles.includes('Files.Admin')) {
      return UserRole.ADMIN;
    }

    if (azureRoles.some(role => role.includes('Write') || role.includes('Delete'))) {
      return UserRole.USER;
    }

    return UserRole.READONLY;
  }

  async createAuthContext(token: string): Promise<AuthContext | null> {
    const payload = await this.validateAccessToken(token);
    if (!payload) {
      return null;
    }

    const azureRoles = payload.roles || [];
    const permissions = this.mapAzureRolesToPermissions(azureRoles);
    const userRole = this.mapAzureRoleToUserRole(azureRoles);

    let servicePrincipalInfo = null;
    try {
      servicePrincipalInfo = await this.getServicePrincipalInfo(payload.oid);
    } catch (error) {
      console.warn('Could not fetch service principal info:', error);
    }

    return {
      user: {
        id: payload.oid,
        email: servicePrincipalInfo?.mail || `${payload.appid}@${payload.tid}`,
        name: servicePrincipalInfo?.displayName || 'Service Principal',
        role: userRole,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      permissions,
      isAuthenticated: true,
    };
  }

  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null;
    }

    return parts[1];
  }

  async getAccessToken(scopes: string[] = ['https://storage.azure.com/.default']): Promise<string | null> {
    try {
      const tokenResponse = await this.credential.getToken(scopes);
      return tokenResponse?.token || null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }
}