import api from './client';
import { User } from '../types/auth';

export const profileApi = {
  updateProfile: async (payload: { name?: string; email?: string }): Promise<User> => {
    const response = await api.patch<User>('/auth/profile', payload);
    return response.data;
  },

  changePassword: async (payload: {
    current_password: string;
    new_password: string;
  }): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/change-password', payload);
    return response.data;
  },
};
