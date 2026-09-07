import api from './client';
import {
  WeeklyReport,
  CreateReportPayload,
  UpdateReportPayload,
  ReportsPaginatedResponse,
  ReportQueryParams,
  DashboardStatsResponse,
} from '../types/report';

export const reportsApi = {
  createReport: async (payload: CreateReportPayload): Promise<WeeklyReport> => {
    const response = await api.post<WeeklyReport>('/reports', payload);
    return response.data;
  },

  updateReport: async (id: number, payload: UpdateReportPayload): Promise<WeeklyReport> => {
    const response = await api.patch<WeeklyReport>(`/reports/${id}`, payload);
    return response.data;
  },

  submitReport: async (id: number): Promise<WeeklyReport> => {
    const response = await api.post<WeeklyReport>(`/reports/${id}/submit`);
    return response.data;
  },

  getReportById: async (id: number): Promise<WeeklyReport> => {
    const response = await api.get<WeeklyReport>(`/reports/${id}`);
    return response.data;
  },

  getMyReports: async (params?: ReportQueryParams): Promise<ReportsPaginatedResponse> => {
    const response = await api.get<ReportsPaginatedResponse>('/reports/my-reports', { params });
    return response.data;
  },

  getAllReports: async (params?: ReportQueryParams): Promise<ReportsPaginatedResponse> => {
    const response = await api.get<ReportsPaginatedResponse>('/reports', { params });
    return response.data;
  },

  getDashboardStats: async (params?: ReportQueryParams): Promise<DashboardStatsResponse> => {
    const response = await api.get<DashboardStatsResponse>('/reports/dashboard-stats', { params });
    return response.data;
  },

  reviewReport: async (
    id: number,
    action: 'approved' | 'needs_correction',
    comment: string,
  ): Promise<WeeklyReport> => {
    const response = await api.post<WeeklyReport>(`/reports/${id}/review`, { action, comment });
    return response.data;
  },
};
