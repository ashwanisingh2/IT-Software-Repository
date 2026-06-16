export const SOFTWARE_CATEGORIES = [
  'Browsers','Remote Support','Networking Tools','Sysinternals','Security Tools','Drivers','Monitoring Tools','Office Tools','Development Tools','Windows Utilities','Custom Applications'
] as const;

export type SoftwareCategory = typeof SOFTWARE_CATEGORIES[number];
export type Role = 'admin' | 'engineer' | 'viewer';
export type FileType = 'exe' | 'msi' | 'zip' | 'bat' | 'ps1';

export interface SoftwarePackage {
  id: string;
  name: string;
  vendor: string;
  category: SoftwareCategory;
  description?: string;
  latestVersion?: SoftwareVersion;
  versions: SoftwareVersion[];
}

export interface SoftwareVersion {
  id: string;
  softwareId: string;
  version: string;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  sha256: string;
  uploadDate: string;
  downloadCount: number;
  githubReleaseId?: string;
  githubAssetId?: string;
  downloadUrl: string;
  silentInstallCommand?: string;
  uninstallCommand?: string;
}

export interface InventoryCheckIn {
  computerName: string;
  osVersion: string;
  installedUpdates: string[];
  installedSoftware: Array<{ name: string; version: string; vendor?: string }>;
}
