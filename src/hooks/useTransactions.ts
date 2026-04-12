import { useQuery } from '@tanstack/react-query'
import { transactionsApi } from '@/api/transactions'

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (params?: object) => ['transactions', 'list', params] as const,
  detail: (id: string | number) => ['transactions', String(id)] as const,
  overview: ['transactions', 'overview'] as const,
}

export function useTransactions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionsApi.getAll(params),
  })
}

export function useTransaction(id: string | number) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionsApi.getById(id),
    enabled: !!id,
  })
}

export function useTransactionOverview() {
  return useQuery({
    queryKey: transactionKeys.overview,
    queryFn: transactionsApi.getOverview,
    refetchInterval: 60_000,
  })
}
