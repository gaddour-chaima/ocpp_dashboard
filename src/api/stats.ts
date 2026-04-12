import { apiClient } from './client'

export const statsApi = {
  getOverview: () =>
    apiClient.get('/api/stats/overview').then((r) => r.data),

  getEnergyDaily: (params?: Record<string, unknown>) =>
    apiClient.get('/api/stats/energy/daily', { params }).then((r) => r.data),

  getEnergyMonthly: (params?: Record<string, unknown>) =>
    apiClient.get('/api/stats/energy/monthly', { params }).then((r) => r.data),

  getSessionsDaily: (params?: Record<string, unknown>) =>
    apiClient.get('/api/stats/sessions/daily', { params }).then((r) => r.data),

  getPowerRealtime: () =>
    apiClient.get('/api/stats/power/realtime').then((r) => r.data),

  getStatusDistribution: () =>
    apiClient.get('/api/stats/status/distribution').then((r) => r.data),

  getAvailability: (params?: Record<string, unknown>) =>
    apiClient.get('/api/stats/availability', { params }).then((r) => r.data),
}
