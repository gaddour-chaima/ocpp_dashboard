import { useQuery } from '@tanstack/react-query'
import { aiApi } from '@/api/ai'

export const aiKeys = {
  forecast: ['ai', 'forecast-energy'] as const,
  anomaly: ['ai', 'anomaly-detection'] as const,
}

export function useAiForecast() {
  return useQuery({
    queryKey: aiKeys.forecast,
    queryFn: aiApi.getForecastEnergy,
    retry: 1,
  })
}

export function useAiAnomaly() {
  return useQuery({
    queryKey: aiKeys.anomaly,
    queryFn: aiApi.getAnomalyDetection,
    retry: 1,
  })
}
