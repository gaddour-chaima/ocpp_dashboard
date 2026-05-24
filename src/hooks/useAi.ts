import { useQuery } from '@tanstack/react-query'
import { aiApi } from '@/api/ai'
import type {
  AiAnomaliesResponse,
  AiAnomalyItem,
  AiForecastPoint,
  AiForecastResponse,
  AiRecommendationsResponse,
  AiRecommendationItem,
  AiSummaryResponse,
} from '@/types'

export const aiKeys = {
  forecast: ['ai', 'insights', 'forecast'] as const,
  anomalies: ['ai', 'insights', 'anomalies'] as const,
  summary: ['ai', 'insights', 'summary'] as const,
  recommendations: ['ai', 'insights', 'recommendations'] as const,
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function pickFirst<T>(...values: Array<T | undefined | null>): T | undefined {
  return values.find((v) => v !== undefined && v !== null)
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeForecast(input: unknown): AiForecastResponse {
  const root = readRecord(input)
  const rawList =
    (pickFirst(root.forecast, root.data, root.points, root.predictions) as unknown[]) ?? []

  const forecast: AiForecastPoint[] = Array.isArray(rawList)
    ? rawList.map((item) => {
        const row = readRecord(item)
        return {
          date: toString(pickFirst(row.date, row.day, row.timestamp), ''),
          energy: toNumber(pickFirst(row.energy, row.predictedEnergy, row.value, row.consumption), 0),
        }
      }).filter((p) => p.date)
    : []

  return { forecast }
}

function normalizeAnomalies(input: unknown): AiAnomaliesResponse {
  const root = readRecord(input)
  const rawList = (pickFirst(root.anomalies, root.data, root.items, root.results) as unknown[]) ?? []

  const anomalies: AiAnomalyItem[] = Array.isArray(rawList)
    ? rawList.map((item) => {
        const row = readRecord(item)
        return {
          chargePointId: toString(pickFirst(row.chargePointId, row.charge_point_id, row.cpId), 'unknown'),
          type: toString(pickFirst(row.type, row.anomalyType, row.anomaly_type), 'unknown'),
          severity: toString(pickFirst(row.severity, row.level), 'low'),
          timestamp: toString(pickFirst(row.timestamp, row.dateTime, row.detectedAt, row.created_at), ''),
          explanation: toString(pickFirst(row.explanation, row.description, row.reason), 'No explanation provided'),
        }
      }).filter((a) => a.timestamp)
    : []

  return { anomalies }
}

function normalizeSummary(input: unknown): AiSummaryResponse {
  const root = readRecord(input)
  return {
    predictedEnergy: toNumber(pickFirst(root.predictedEnergy, root.predicted_energy, root.energyForecast, root.energy)),
    confidenceScore: toNumber(pickFirst(root.confidenceScore, root.confidence_score, root.confidence)),
    predictionPeriod: toString(pickFirst(root.predictionPeriod, root.prediction_period, root.period), '7 days'),
    modelName: toString(pickFirst(root.modelName, root.model_name, root.model), 'N/A'),
    anomaliesCount: toNumber(pickFirst(root.anomaliesCount, root.anomalies_count, root.anomalyCount, root.totalAnomalies)),
  }
}

function normalizeRecommendations(input: unknown): AiRecommendationsResponse {
  const root = readRecord(input)
  const rawList =
    (pickFirst(root.recommendations, root.data, root.items, root.results) as unknown[]) ?? []

  const recommendations: AiRecommendationItem[] = Array.isArray(rawList)
    ? rawList.map((item, index) => {
        const row = readRecord(item)
        return {
          id: toString(pickFirst(row.id, row.recommendationId, row.recommendation_id), `rec-${index}`),
          message: toString(pickFirst(row.message, row.recommendation, row.text), ''),
        }
      }).filter((r) => r.message)
    : []

  return { recommendations }
}

export function useAiForecast() {
  return useQuery({
    queryKey: aiKeys.forecast,
    queryFn: aiApi.getForecast,
    select: normalizeForecast,
    staleTime: 45_000,
    refetchInterval: 60_000,
    retry: 1,
  })
}

export function useAiAnomalies() {
  return useQuery({
    queryKey: aiKeys.anomalies,
    queryFn: aiApi.getAnomalies,
    select: normalizeAnomalies,
    staleTime: 45_000,
    refetchInterval: 60_000,
    retry: 1,
  })
}

export function useAiSummary() {
  return useQuery({
    queryKey: aiKeys.summary,
    queryFn: aiApi.getSummary,
    select: normalizeSummary,
    staleTime: 45_000,
    refetchInterval: 60_000,
    retry: 1,
  })
}

export function useAiRecommendations() {
  return useQuery({
    queryKey: aiKeys.recommendations,
    queryFn: aiApi.getRecommendations,
    select: normalizeRecommendations,
    staleTime: 45_000,
    refetchInterval: 60_000,
    retry: 1,
  })
}
