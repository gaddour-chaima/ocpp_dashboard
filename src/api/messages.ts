import { apiClient } from './client'

export const messagesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get('/api/messages', { params }).then((r) => r.data),

  getById: (id: string | number) =>
    apiClient.get(`/api/messages/${id}`).then((r) => r.data),
}
