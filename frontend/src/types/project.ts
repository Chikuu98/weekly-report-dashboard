export interface Project {
  id: number;
  name: string;
  description?: string;
  color_code: string;
  created_at: string;
  updated_at: string;
  reports_count?: number;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  color_code?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  color_code?: string;
}
