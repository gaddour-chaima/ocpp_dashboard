import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
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

export function useInfiniteTransactions(params?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: transactionKeys.list(params),
    queryFn: ({ pageParam = 1 }) => transactionsApi.getAll({ ...params, page: pageParam, limit: 15 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const { page, totalPages } = lastPage.meta || {}
      return page < totalPages ? page + 1 : undefined
    },
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
