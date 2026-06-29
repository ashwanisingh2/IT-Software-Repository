export const SOFTWARE_CATEGORIES = [
  { id: 'browser', label: 'Browser', icon: 'ti-world', description: 'Web browsers' },
  { id: 'security', label: 'Security', icon: 'ti-shield', description: 'Antivirus, firewall, security tools' },
  { id: 'development', label: 'Development', icon: 'ti-code', description: 'IDEs, git, compilers' },
  { id: 'utility', label: 'Utility', icon: 'ti-tool', description: 'System utilities' },
  { id: 'office', label: 'Office', icon: 'ti-file-text', description: 'Productivity apps' },
  { id: 'communication', label: 'Communication', icon: 'ti-message', description: 'Chat, video, email' },
  { id: 'media', label: 'Media', icon: 'ti-player-play', description: 'Players, editors' },
  { id: 'networking', label: 'Networking', icon: 'ti-network', description: 'VPN, SSH, RDP' },
  { id: 'system', label: 'System', icon: 'ti-cpu', description: 'Drivers, runtimes' },
  { id: 'other', label: 'Other', icon: 'ti-apps', description: 'Uncategorized' },
] as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  INVALID_FILE: 'INVALID_FILE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
} as const;
