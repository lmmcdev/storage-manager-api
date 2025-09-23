export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  userId: string;
  permissions: Permission[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
}

export interface ApiKeyCreate {
  name: string;
  permissions: Permission[];
  expiresAt?: Date;
}

export interface ApiKeyResult {
  id: string;
  name: string;
  key: string;
  permissions: Permission[];
  expiresAt?: Date;
  createdAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  READONLY = 'readonly',
}

export enum Permission {
  FILES_READ = 'files:read',
  FILES_WRITE = 'files:write',
  FILES_DELETE = 'files:delete',
  FILES_LIST = 'files:list',
  FILES_COPY = 'files:copy',
  FILES_SAS = 'files:sas',
  ADMIN_USERS = 'admin:users',
  ADMIN_KEYS = 'admin:keys',
}

export interface AuthContext {
  user?: User;
  apiKey?: ApiKey;
  permissions: Permission[];
  isAuthenticated: boolean;
}