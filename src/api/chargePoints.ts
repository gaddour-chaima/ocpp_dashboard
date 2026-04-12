import { apiClient } from './client'

export const chargePointsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get('/api/charge-points', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get(`/api/charge-points/${id}`).then((r) => r.data),

  getStatusHistory: (id: string, params?: Record<string, unknown>) =>
    apiClient.get(`/api/charge-points/${id}/status-history`, { params }).then((r) => r.data),

  getMeterValues: (id: string, params?: Record<string, unknown>) =>
    apiClient.get(`/api/charge-points/${id}/meter-values`, { params }).then((r) => r.data),

  getTransactions: (id: string, params?: Record<string, unknown>) =>
    apiClient.get(`/api/charge-points/${id}/transactions`, { params }).then((r) => r.data),
}
