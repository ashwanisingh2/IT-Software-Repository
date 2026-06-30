export type UserRole = 'super_admin' | 'admin' | 'deployer' | 'viewer';
export type SoftwareCategory = 'browser' | 'security' | 'development' | 'utility' | 'office' | 'communication' | 'media' | 'networking' | 'system' | 'other';
export type SoftwareStatus = 'active' | 'deprecated' | 'beta';
export type DocCategory = 'kb' | 'sop' | 'guide' | 'network' | 'server' | 'other';
export type EndpointStatus = 'active' | 'stale' | 'decommissioned' | 'manual';
export type DeploymentStatus = 'pending' | 'completed' | 'failed';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
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
  silentInstallArgs?: string;
  architecture: string;
  requiresSoftwareId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
}

export interface EnrollmentToken {
  id: string;
  token: string;
  label: string;
  createdBy: string;
  maxUses: number | null;
  useCount: number;
  expiresAt: string | null;
  revoked: boolean;
  createdAt: string;
}

export interface Endpoint {
  id: string;
  machineId: string;
  hostname: string;
  ipAddress: string | null;
  osName: string;
  osVersion: string;
  osArch: string;
  enrollmentTokenId?: string;
  agentVersion?: string;
  apiKeyHash?: string;
  status: EndpointStatus;
  lastCheckin: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentRequest {
  id: string;
  endpointId: string;
  softwareId: string;
  requestedBy: string;
  status: DeploymentStatus;
  requestedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface InstalledSoftware {
  id: string;
  endpointId: string;
  softwareId?: string;
  name: string;
  version: string;
  vendor: string;
  installedAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface Doc {
  id: string;
  title: string;
  content: string;
  category: DocCategory;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
