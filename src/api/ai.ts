import { apiClient } from './client'

export const aiApi = {
  getForecastEnergy: () =>
    apiClient.get('/api/ai/forecast-energy').then((r) => r.data),

  getAnomalyDetection: () =>
    apiClient.get('/api/ai/anomaly-detection').then((r) => r.data),
}
