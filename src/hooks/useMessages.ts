import { useQuery } from '@tanstack/react-query'
import { messagesApi } from '@/api/messages'

export const messageKeys = {
  list: (params?: object) => ['messages', 'list', params] as const,
  detail: (id: string | number) => ['messages', String(id)] as const,
}

export function useMessages(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: messageKeys.list(params),
    queryFn: () => messagesApi.getAll(params),
  })
}

export function useMessage(id: string | number) {
  return useQuery({
    queryKey: messageKeys.detail(id),
    queryFn: () => messagesApi.getById(id),
    enabled: !!id,
  })
}
