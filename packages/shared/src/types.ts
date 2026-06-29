import { z } from 'zod';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DEPLOYER = 'deployer',
  VIEWER = 'viewer',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Software {
  id: string;
  name: string;
  vendor: string | null;
  category: string | null;
  version: string;
  latest_version: string;
  sha256: string;
  file_size: number;
  download_count: number;
  storage_url: string;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Endpoint {
  id: string;
  machine_id: string;
  hostname: string;
  os_version: string | null;
  installed_software: any;
  last_checkin: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
