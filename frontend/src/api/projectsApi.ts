import api from './client';
import { Project, CreateProjectPayload, UpdateProjectPayload } from '../types/project';

export const projectsApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get<Project[]>('/projects');
    return response.data;
  },

  getProjectById: async (id: number): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  createProject: async (payload: CreateProjectPayload): Promise<Project> => {
    const response = await api.post<Project>('/projects', payload);
    return response.data;
  },

  updateProject: async (id: number, payload: UpdateProjectPayload): Promise<Project> => {
    const response = await api.patch<Project>(`/projects/${id}`, payload);
    return response.data;
  },

  deleteProject: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/projects/${id}`);
    return response.data;
  },
};
