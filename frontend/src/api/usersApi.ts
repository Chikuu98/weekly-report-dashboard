import api from './client';
import { User } from '../types/auth';
import { WeeklyReport } from '../types/report';

export interface UserWithStats extends User {
  stats: {
    totalReports: number;
    approvedCount: number;
    needsCorrectionCount: number;
    submittedCount: number;
    draftCount: number;
    complianceRate: number;
    openBlockersCount?: number;
  };
}

export interface UserProfileResponse {
  user: User;
  stats: {
    totalReports: number;
    approvedCount: number;
    needsCorrectionCount: number;
    submittedCount: number;
    draftCount: number;
    complianceRate: number;
    openBlockersCount: number;
  };
  reports: WeeklyReport[];
}

export const usersApi = {
  getAllTeamMembers: async (): Promise<UserWithStats[]> => {
    const response = await api.get<UserWithStats[]>('/users');
    return response.data;
  },

  getUserProfile: async (id: number): Promise<UserProfileResponse> => {
    const response = await api.get<UserProfileResponse>(`/users/${id}`);
    return response.data;
  },
};
