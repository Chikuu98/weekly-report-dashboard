import { User } from './auth';

export interface Project {
  id: number;
  name: string;
  description?: string;
  color_code: string;
  created_at: string;
  updated_at: string;
  reports_count?: number;
  members?: User[];
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  color_code?: string;
  member_ids?: number[];
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  color_code?: string;
  member_ids?: number[];
}
