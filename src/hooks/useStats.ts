import { useQuery } from '@tanstack/react-query'
import { healthApi } from '@/api/health'
import { statsApi } from '@/api/stats'

export const queryKeys = {
  health: ['health'] as const,
  statsOverview: ['stats', 'overview'] as const,
  energyDaily: (params?: object) => ['stats', 'energy', 'daily', params] as const,
  energyMonthly: (params?: object) => ['stats', 'energy', 'monthly', params] as const,
  sessionsDaily: (params?: object) => ['stats', 'sessions', 'daily', params] as const,
  powerRealtime: ['stats', 'power', 'realtime'] as const,
  statusDistribution: ['stats', 'status', 'distribution'] as const,
  availability: (params?: object) => ['stats', 'availability', params] as const,
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: healthApi.getHealth,
    refetchInterval: 30_000,
  })
}

export function useStatsOverview() {
  return useQuery({
    queryKey: queryKeys.statsOverview,
    queryFn: statsApi.getOverview,
    refetchInterval: 60_000,
  })
}

export function useEnergyDaily(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.energyDaily(params),
    queryFn: () => statsApi.getEnergyDaily(params),
  })
}

export function useEnergyMonthly(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.energyMonthly(params),
    queryFn: () => statsApi.getEnergyMonthly(params),
  })
}

export function useSessionsDaily(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.sessionsDaily(params),
    queryFn: () => statsApi.getSessionsDaily(params),
  })
}

export function usePowerRealtime() {
  return useQuery({
    queryKey: queryKeys.powerRealtime,
    queryFn: statsApi.getPowerRealtime,
    refetchInterval: 15_000,
  })
}

export function useStatusDistribution() {
  return useQuery({
    queryKey: queryKeys.statusDistribution,
    queryFn: statsApi.getStatusDistribution,
    refetchInterval: 30_000,
  })
}

export function useAvailability(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.availability(params),
    queryFn: () => statsApi.getAvailability(params),
  })
}
