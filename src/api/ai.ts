import { apiClient } from './client'
import type {
  AiAnomalyItem,
  AiAnomaliesResponse,
  AiForecastPoint,
  AiForecastResponse,
  AiRecommendationItem,
  AiRecommendationsResponse,
  AiSummaryResponse,
} from '@/types'

interface AiInsightsBundle {
  forecast: AiForecastResponse
  anomalies: AiAnomaliesResponse
  summary: AiSummaryResponse
  recommendations: AiRecommendationsResponse
}

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || ''
const GEMINI_MODEL = (import.meta.env.VITE_GEMINI_MODEL as string) || 'gemini-2.5-flash'
const AI_CACHE_MS = 60_000

let bundleCache: { value: AiInsightsBundle; expiresAt: number } | null = null
let inflightBundle: Promise<AiInsightsBundle> | null = null

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function toArray<T = Record<string, unknown>>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  const rec = toRecord(value)
  if (Array.isArray(rec.data)) return rec.data as T[]
  if (Array.isArray(rec.items)) return rec.items as T[]
  if (Array.isArray(rec.results)) return rec.results as T[]
  return []
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function parseDateInput(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function toLocalDateKey(value: unknown): string {
  const d = parseDateInput(value)
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function sortByDateAsc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const da = parseDateInput(a.date)?.getTime() ?? 0
    const db = parseDateInput(b.date)?.getTime() ?? 0
    return da - db
  })
}

function toIsoDate(input: Date): string {
  const y = input.getFullYear()
  const m = String(input.getMonth() + 1).padStart(2, '0')
  const d = String(input.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function datePlusDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function movingAverage(values: number[], windowSize: number): number {
  if (!values.length) return 0
  const start = Math.max(0, values.length - windowSize)
  const slice = values.slice(start)
  const sum = slice.reduce((acc, n) => acc + n, 0)
  return slice.length ? sum / slice.length : 0
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(Math.max(0, variance))
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function ratio(value: number, denom: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(denom) || denom === 0) return 0
  return value / denom
}

function normalizeSeverity(value: unknown): 'low' | 'medium' | 'high' | 'critical' {
  const v = String(value ?? '').toLowerCase()
  if (v === 'critical' || v === 'high' || v === 'medium' || v === 'low') return v
  if (v === 'severe') return 'high'
  return 'medium'
}

function extractChargePointId(row: Record<string, unknown>): string {
  const id = row.chargePointId ?? row.charge_point_id ?? row.cpId ?? row.chargePoint ?? row.id
  return typeof id === 'string' && id.trim() ? id.trim() : ''
}

function dedupeAnomalies(anomalies: AiAnomalyItem[]): AiAnomalyItem[] {
  const map = new Map<string, AiAnomalyItem>()
  anomalies.forEach((a) => {
    const ts = parseDateInput(a.timestamp)?.getTime() ?? Date.now()
    const minuteBucket = Math.floor(ts / 60000)
    const key = `${a.chargePointId}|${a.type}|${minuteBucket}`
    if (!map.has(key)) map.set(key, a)
  })
  return Array.from(map.values())
}

function normalizeDailyEnergyRows(raw: unknown): Array<{ date: string; energy: number }> {
  const rows = toArray<Record<string, unknown>>(raw)
  const dailyMap = new Map<string, number>()

  rows.forEach((row) => {
    const date = toLocalDateKey(row.date ?? row.day ?? row.timestamp ?? row.createdAt)
    if (!date) return
    const energy = toNumber(row.energy ?? row.totalEnergy ?? row.value ?? row.energyWh)
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + Math.max(0, energy))
  })

  return sortByDateAsc(
    Array.from(dailyMap.entries()).map(([date, energy]) => ({ date, energy }))
  )
}

function normalizeDailySessionsRows(raw: unknown): Array<{ date: string; sessions: number }> {
  const rows = toArray<Record<string, unknown>>(raw)
  const dailyMap = new Map<string, number>()

  rows.forEach((row) => {
    const date = toLocalDateKey(row.date ?? row.day ?? row.timestamp ?? row.createdAt)
    if (!date) return
    const sessions = toNumber(row.sessions ?? row.count ?? row.value ?? 0)
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + Math.max(0, sessions))
  })

  return sortByDateAsc(
    Array.from(dailyMap.entries()).map(([date, sessions]) => ({ date, sessions }))
  )
}

function normalizeFromTransactions(raw: unknown): Array<{ date: string; energy: number; sessions: number }> {
  const rows = toArray<Record<string, unknown>>(raw)
  const dailyMap = new Map<string, { energy: number; sessions: number }>()

  rows.forEach((row) => {
    const date = toLocalDateKey(row.stopTime ?? row.startTime ?? row.createdAt ?? row.timestamp)
    if (!date) return
    const energy = Math.max(
      0,
      toNumber(
        row.energyConsumed ??
          row.energyWh ??
          (toNumber(row.meterStop, 0) - toNumber(row.meterStart, 0))
      )
    )
    const prev = dailyMap.get(date) ?? { energy: 0, sessions: 0 }
    dailyMap.set(date, { energy: prev.energy + energy, sessions: prev.sessions + 1 })
  })

  return sortByDateAsc(
    Array.from(dailyMap.entries()).map(([date, v]) => ({
      date,
      energy: v.energy,
      sessions: v.sessions,
    }))
  )
}

function buildLocalForecast(energySeries: Array<{ date: string; energy: number }>): AiForecastPoint[] {
  const normalized = sortByDateAsc(energySeries)
    .map((p) => ({ date: p.date, energy: Math.max(0, toNumber(p.energy)) }))
    .filter((p) => p.date)
    .slice(-60)

  const recentValues = normalized.map((p) => p.energy).filter((v) => Number.isFinite(v))
  if (!recentValues.length) {
    const start = new Date()
    return Array.from({ length: 7 }, (_, i) => ({
      date: toIsoDate(datePlusDays(start, i + 1)),
      energy: 0,
    }))
  }

  const shortMA = movingAverage(recentValues, 7) || movingAverage(recentValues, 3)
  const longMA = movingAverage(recentValues, 28) || movingAverage(recentValues, 14) || shortMA
  const trendPerDay = (shortMA - longMA) / 7

  const weeklySeasonality = new Array<number>(7).fill(1)
  const byWeekday: number[][] = [[], [], [], [], [], [], []]
  normalized.forEach((p) => {
    const wd = new Date(`${p.date}T00:00:00`).getDay()
    byWeekday[wd].push(p.energy)
  })
  const baseline = shortMA || longMA || median(recentValues) || 0
  byWeekday.forEach((vals, idx) => {
    const m = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : baseline
    weeklySeasonality[idx] = clamp(ratio(m, baseline || 1), 0.75, 1.25)
  })

  const anchorDate = normalized.length
    ? (parseDateInput(normalized[normalized.length - 1].date) ?? new Date())
    : new Date()
  const tomorrow = datePlusDays(startOfDay(new Date()), 1)
  const anchoredTomorrow = datePlusDays(startOfDay(anchorDate), 1)
  const forecastStart = anchoredTomorrow > tomorrow ? anchoredTomorrow : tomorrow

  const volatility = stdDev(recentValues)
  const volatilityCap = Math.max(500, volatility * 0.6)

  return Array.from({ length: 7 }, (_, i) => {
    const targetDate = datePlusDays(forecastStart, i)
    const wd = targetDate.getDay()
    const rawTrend = trendPerDay * (i + 1)
    const boundedTrend = clamp(rawTrend, -volatilityCap, volatilityCap)
    const seasonal = weeklySeasonality[wd] ?? 1
    const raw = (baseline + boundedTrend) * seasonal

    return {
      date: toIsoDate(targetDate),
      energy: Math.max(0, Math.round(raw)),
    }
  })
}

function buildLocalAnomalies(chargePoints: Record<string, unknown>[], realtime: Record<string, unknown>[]): AiAnomalyItem[] {
  const nowIso = new Date().toISOString()
  const fromStatus = chargePoints
    .filter((cp) => {
      const status = String(cp.status ?? '')
      return status === 'Faulted' || status === 'Unavailable' || status === 'Offline'
    })
    .map((cp) => {
      const status = String(cp.status ?? 'Offline')
      const severity = status === 'Faulted' ? 'high' : 'medium'
      return {
        chargePointId: extractChargePointId(cp) || 'unknown',
        type: status === 'Faulted' ? 'Fault state detected' : 'Availability issue',
        severity: normalizeSeverity(severity),
        timestamp: String(cp.lastSeen ?? cp.updatedAt ?? nowIso),
        explanation:
          status === 'Faulted'
            ? 'Charge point reported Faulted status. Inspect connector, power modules, and recent error codes.'
            : 'Charge point is not available for charging. Verify connectivity and operational state.',
      }
    })

  const powerValues = realtime.map((row) => toNumber(row.power)).filter((v) => Number.isFinite(v))
  const pMedian = median(powerValues)
  const rawMad = median(powerValues.map((v) => Math.abs(v - pMedian))) || 0
  const mad = Math.max(rawMad, 50, pMedian * 0.15)
  const inferredHighCap = 120000

  const fromPower = realtime
    .filter((row) => {
      const p = toNumber(row.power)
      const robustZ = 0.6745 * (p - pMedian) / mad
      return p < 0 || p > inferredHighCap || (p > 0 && Math.abs(robustZ) > 5)
    })
    .map((row) => ({
      chargePointId: extractChargePointId(row) || 'unknown',
      type: 'Abnormal power reading',
      severity: normalizeSeverity('high'),
      timestamp: String(row.timestamp ?? nowIso),
      explanation: `Measured power ${toNumber(row.power).toFixed(0)}W is outside expected operating range.`,
    }))

  const last24h = Date.now() - 24 * 60 * 60 * 1000
  const recent = [...fromStatus, ...fromPower].filter((a) => {
    const ts = parseDateInput(a.timestamp)?.getTime() ?? 0
    return ts >= last24h
  })

  return dedupeAnomalies(recent)
    .filter((a) => a.chargePointId !== 'unknown' || !a.type.toLowerCase().includes('power'))
    .sort((a, b) => {
      const severityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
      const bySeverity = (severityWeight[b.severity] ?? 1) - (severityWeight[a.severity] ?? 1)
      if (bySeverity !== 0) return bySeverity
      const tA = parseDateInput(a.timestamp)?.getTime() ?? 0
      const tB = parseDateInput(b.timestamp)?.getTime() ?? 0
      return tB - tA
    })
    .slice(0, 12)
}

function buildLocalRecommendations(anomalies: AiAnomalyItem[]): AiRecommendationItem[] {
  if (!anomalies.length) {
    return [{ id: 'rec-0', message: 'No anomalies detected. Keep monitoring charging sessions and review weekly forecast deviations.' }]
  }

  const unique: AiAnomalyItem[] = []
  const seen = new Set<string>()
  anomalies.forEach((a) => {
    const key = `${a.chargePointId}|${a.type}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(a)
    }
  })

  return unique.slice(0, 5).map((a, i) => {
    let action = 'Review charger logs and verify communication stability.'
    if (a.type.toLowerCase().includes('power')) {
      action = 'Check cable connection, meter calibration, and charger power configuration.'
    } else if (a.type.toLowerCase().includes('fault')) {
      action = 'Inspect connector hardware and clear active fault codes after root-cause check.'
    } else if (a.type.toLowerCase().includes('availability')) {
      action = 'Validate charger connectivity and reboot device if heartbeat remains unstable.'
    }

    return {
      id: `rec-${i + 1}`,
      message: `${a.chargePointId || 'This charge point'} has ${a.type.toLowerCase()}. ${action}`,
    }
  })
}

function stripCodeFence(text: string): string {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
}

async function enhanceWithGemini(bundle: AiInsightsBundle): Promise<AiInsightsBundle> {
  if (!GEMINI_API_KEY) return bundle

  const today = toLocalDateKey(new Date())
  const prompt = `
You are an EV charging AI supervisor.
Today's date: ${today}
Transform the validated telemetry into this strict JSON schema:
{
  "summary": {
    "predictedEnergy": number,
    "confidenceScore": number,
    "predictionPeriod": "7 days",
    "modelName": string,
    "anomaliesCount": number
  },
  "anomalies": {
    "anomalies": [
      {
        "chargePointId": string,
        "type": string,
        "severity": "low" | "medium" | "high" | "critical",
        "timestamp": string,
        "explanation": string
      }
    ]
  },
  "recommendations": {
    "recommendations": [
      {
        "id": string,
        "message": string
      }
    ]
  }
}
Rules:
- Keep forecast unchanged.
- Do not invent new chargePointId values, timestamps, or anomaly events.
- Use ONLY anomalies already present in input. Do not add/remove anomalies.
- Recommendations must be based strictly on input anomalies.
- Keep confidenceScore realistic (45 to 97).
- If unsure, keep concise and conservative.
- Output JSON only, no markdown.

INPUT:
${JSON.stringify(bundle)}
`.trim()

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!response.ok) return bundle
  const payload = await response.json()
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text || typeof text !== 'string') return bundle

  try {
    const parsed = JSON.parse(stripCodeFence(text))
    const summary = toRecord(parsed.summary)
    const recommendationBlock = toRecord(parsed.recommendations)
    const localAnomalyKeys = new Set(
      bundle.anomalies.anomalies.map((a) => `${a.chargePointId}|${a.type}`)
    )

    return {
      forecast: bundle.forecast,
      summary: {
        predictedEnergy: toNumber(summary.predictedEnergy, bundle.summary.predictedEnergy),
        confidenceScore: toNumber(summary.confidenceScore, bundle.summary.confidenceScore),
        predictionPeriod: String(summary.predictionPeriod ?? bundle.summary.predictionPeriod),
        modelName: String(summary.modelName ?? GEMINI_MODEL),
        anomaliesCount: toNumber(summary.anomaliesCount, bundle.summary.anomaliesCount),
      },
      anomalies: {
        anomalies: bundle.anomalies.anomalies,
      },
      recommendations: {
        recommendations: toArray(recommendationBlock.recommendations)
          .map((r, i) => {
            const row = toRecord(r)
            return {
              id: String(row.id ?? `rec-${i + 1}`),
              message: String(row.message ?? ''),
              chargePointId: String(row.chargePointId ?? ''),
              type: String(row.type ?? ''),
            }
          })
          .filter((r) => {
            if (!r.message) return false
            if (!r.chargePointId || !r.type) return true
            return localAnomalyKeys.has(`${r.chargePointId}|${r.type}`)
          })
          .map((r) => ({ id: r.id, message: r.message }))
          .slice(0, 8),
      },
    }
  } catch {
    return bundle
  }
}

async function buildInsightsBundle(): Promise<AiInsightsBundle> {
  const [dailyRaw, chargePointsRaw, realtimeRaw, sessionsRaw, txRaw] = await Promise.all([
    apiClient.get('/api/stats/energy/daily').then((r) => r.data).catch(() => []),
    apiClient.get('/api/charge-points').then((r) => r.data).catch(() => []),
    apiClient.get('/api/stats/power/realtime').then((r) => r.data).catch(() => []),
    apiClient.get('/api/stats/sessions/daily').then((r) => r.data).catch(() => []),
    apiClient.get('/api/transactions', { params: { limit: 1000, page: 1 } }).then((r) => r.data).catch(() => []),
  ])

  let dailyPoints = normalizeDailyEnergyRows(dailyRaw)
  let dailySessions = normalizeDailySessionsRows(sessionsRaw)

  const txDaily = normalizeFromTransactions(txRaw)
  if (dailyPoints.length < 7 && txDaily.length) {
    dailyPoints = txDaily.map((d) => ({ date: d.date, energy: d.energy }))
  }
  if (dailySessions.length < 7 && txDaily.length) {
    dailySessions = txDaily.map((d) => ({ date: d.date, sessions: d.sessions }))
  }

  const chargePoints = toArray<Record<string, unknown>>(chargePointsRaw)
  const realtime = toArray<Record<string, unknown>>(realtimeRaw)

  const forecast = buildLocalForecast(dailyPoints)
  const anomaliesFromInfra = buildLocalAnomalies(chargePoints, realtime)

  const recentEnergy = dailyPoints.slice(-21).map((d) => d.energy).filter((v) => Number.isFinite(v))
  const eMedian = median(recentEnergy)
  const eMad = median(recentEnergy.map((v) => Math.abs(v - eMedian))) || 1
  const energyOutliers = dailyPoints.slice(-7)
    .map((d) => {
      const z = 0.6745 * (d.energy - eMedian) / eMad
      return { ...d, z }
    })
    .filter((d) => Math.abs(d.z) > 4)
    .map<AiAnomalyItem>((d) => ({
      chargePointId: 'network',
      type: 'Daily energy outlier',
      severity: Math.abs(d.z) > 6 ? 'high' : 'medium',
      timestamp: `${d.date}T00:00:00.000Z`,
      explanation: `Network energy (${Math.round(d.energy)} Wh) deviates significantly from recent baseline.`,
    }))

  const sessionOutliers = dailySessions.slice(-7)
    .filter((d) => d.date)
    .map((d) => {
      const all = dailySessions.slice(-21).map((s) => s.sessions)
      const m = median(all)
      const mMad = median(all.map((v) => Math.abs(v - m))) || 1
      const z = 0.6745 * (d.sessions - m) / mMad
      return { ...d, z }
    })
    .filter((d) => Math.abs(d.z) > 4)
    .map<AiAnomalyItem>((d) => ({
      chargePointId: 'network',
      type: 'Daily session volume anomaly',
      severity: 'medium',
      timestamp: `${d.date}T00:00:00.000Z`,
      explanation: `Session count (${Math.round(d.sessions)}) is abnormal versus recent trend.`,
    }))

  const anomalies = [...anomaliesFromInfra, ...energyOutliers, ...sessionOutliers].slice(0, 12)
  const cleanedAnomalies = dedupeAnomalies(anomalies).slice(0, 12)
  const recommendations = buildLocalRecommendations(cleanedAnomalies)

  const predictedTotal = Math.round(forecast.reduce((acc, p) => acc + p.energy, 0))
  const completeness = clamp(ratio(dailyPoints.length, 30), 0, 1)
  const variability = ratio(stdDev(recentEnergy), movingAverage(recentEnergy, 14) || 1)
  const stabilityScore = clamp(1 - variability, 0, 1)
  const anomalyPenalty = clamp(1 - ratio(anomalies.length, 10), 0.4, 1)
  const confidenceScore = Math.round(clamp((0.45 * completeness + 0.4 * stabilityScore + 0.15 * anomalyPenalty) * 100, 45, 97))

  const bundle: AiInsightsBundle = {
    forecast: { forecast },
    anomalies: { anomalies: cleanedAnomalies },
    summary: {
      predictedEnergy: predictedTotal,
      confidenceScore,
      predictionPeriod: '7 days',
      modelName: GEMINI_API_KEY ? GEMINI_MODEL : 'Local Trend Analyzer',
      anomaliesCount: cleanedAnomalies.length,
    },
    recommendations: { recommendations },
  }

  const enhanced = await enhanceWithGemini(bundle)

  return {
    ...enhanced,
    summary: {
      ...enhanced.summary,
      anomaliesCount: enhanced.anomalies.anomalies.length,
      predictionPeriod: '7 days',
    },
  }
}

async function getInsightsBundle(): Promise<AiInsightsBundle> {
  const now = Date.now()
  if (bundleCache && bundleCache.expiresAt > now) return bundleCache.value
  if (inflightBundle) return inflightBundle

  inflightBundle = buildInsightsBundle()
    .then((value) => {
      bundleCache = { value, expiresAt: Date.now() + AI_CACHE_MS }
      return value
    })
    .finally(() => {
      inflightBundle = null
    })

  return inflightBundle
}

export const aiApi = {
  getForecast: async () => (await getInsightsBundle()).forecast,

  getAnomalies: async () => (await getInsightsBundle()).anomalies,

  getSummary: async () => (await getInsightsBundle()).summary,

  getRecommendations: async () => (await getInsightsBundle()).recommendations,
}
