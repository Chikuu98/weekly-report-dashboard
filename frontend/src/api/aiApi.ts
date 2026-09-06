import api from './client';

export interface AiChatResponse {
  answer: string;
  timestamp?: string;
}

export const aiApi = {
  askAssistant: async (query: string): Promise<AiChatResponse> => {
    const response = await api.post<AiChatResponse>('/ai/chat', { query });
    return response.data;
  },
};
