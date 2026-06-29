export type UserRole = 'super_admin' | 'admin' | 'deployer' | 'viewer';

export type SoftwareCategory = 'browser' | 'security' | 'development' | 'utility' |
                  'office' | 'communication' | 'media' | 'networking' |
                  'system' | 'other';

export type SoftwareStatus = 'active' | 'deprecated' | 'beta';

export type DocCategory = 'kb' | 'sop' | 'guide' | 'network' | 'server' | 'other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Software {
  id: string;
  name: string;
  vendor: string;
  description: string;
  category: SoftwareCategory;
  status: SoftwareStatus;
  latestVersion: string;
  sha256: string;
  fileSize: number;
  storageUrl: string;
  downloadCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface SoftwareVersion {
  id: string;
  softwareId: string;
  version: string;
  sha256: string;
  fileSize: number;
  storageUrl: string;
  releaseNotes: string;
  isLatest: boolean;
  createdAt: Date;
}

export interface Endpoint {
  id: string;
  machineId: string;
  hostname: string;
  ipAddress: string;
  osName: string;
  osVersion: string;
  osArch: string;
  lastCheckin: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstalledSoftware {
  id: string;
  endpointId: string;
  softwareId: string | null;
  name: string;
  version: string;
  vendor: string;
  installedAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export interface Doc {
  id: string;
  title: string;
  content: string;
  category: DocCategory;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface RolePermission {
  role: UserRole;
  resource: string;
  action: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
