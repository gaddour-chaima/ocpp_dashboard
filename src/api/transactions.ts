import { apiClient } from './client'

export const transactionsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get('/api/transactions', { params }).then((r) => r.data),

  getById: (id: string | number) =>
    apiClient.get(`/api/transactions/${id}`).then((r) => r.data),

  getOverview: () =>
    apiClient.get('/api/transactions/summary/overview').then((r) => r.data),
}
