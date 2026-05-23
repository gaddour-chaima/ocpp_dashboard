import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chargePointsApi } from '@/api/chargePoints'

export const chargePointKeys = {
  all: ['charge-points'] as const,
  list: (params?: object) => ['charge-points', 'list', params] as const,
  detail: (id: string) => ['charge-points', id] as const,
  statusHistory: (id: string, params?: object) => ['charge-points', id, 'status-history', params] as const,
  meterValues: (id: string, params?: object) => ['charge-points', id, 'meter-values', params] as const,
  transactions: (id: string, params?: object) => ['charge-points', id, 'transactions', params] as const,
}

export function useChargePoints(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: chargePointKeys.list(params),
    queryFn: () => chargePointsApi.getAll(params),
    refetchInterval: 30_000,
  })
}

export function useInfiniteChargePoints(params?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: chargePointKeys.list({ ...params, infinite: true }),
    queryFn: ({ pageParam = 1 }) => chargePointsApi.getAll({ ...params, page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const { page, totalPages } = lastPage.meta || {}
      return page < totalPages ? page + 1 : undefined
    },
    refetchInterval: 30_000,
  })
}

export function useChargePoint(id: string) {
  return useQuery({
    queryKey: chargePointKeys.detail(id),
    queryFn: () => chargePointsApi.getById(id),
    enabled: !!id,
    refetchInterval: 30_000,
  })
}

export function useChargePointStatusHistory(id: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: chargePointKeys.statusHistory(id, params),
    queryFn: () => chargePointsApi.getStatusHistory(id, params),
    enabled: !!id,
  })
}

export function useChargePointMeterValues(id: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: chargePointKeys.meterValues(id, params),
    queryFn: () => chargePointsApi.getMeterValues(id, params),
    enabled: !!id,
  })
}

export function useChargePointTransactions(id: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: chargePointKeys.transactions(id, params),
    queryFn: () => chargePointsApi.getTransactions(id, params),
    enabled: !!id,
  })
}

export function useUpdateChargePoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { pricePerKWh?: number; [key: string]: any } }) => 
      chargePointsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chargePointKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: chargePointKeys.list() })
    },
  })
}
