import { apiClient } from './client'

export const healthApi = {
  getHealth: () => apiClient.get('/api/health').then((r) => r.data),
}
