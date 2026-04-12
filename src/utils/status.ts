import type { ChargePointStatus } from '@/types'

export function getStatusColor(status: ChargePointStatus | string): string {
  const map: Record<string, string> = {
    Available: 'badge-online',
    Charging: 'badge-charging',
    Preparing: 'badge-preparing',
    Finishing: 'badge-preparing',
    SuspendedEVSE: 'badge-reserved',
    SuspendedEV: 'badge-reserved',
    Reserved: 'badge-reserved',
    Unavailable: 'badge-offline',
    Faulted: 'badge-faulted',
    Offline: 'badge-offline',
    active: 'badge-active',
    completed: 'badge-completed',
    stopped: 'badge-stopped',
    error: 'badge-error',
  }
  return map[status] ?? 'badge-offline'
}

export function getStatusDot(status: string): string {
  const map: Record<string, string> = {
    Available: '#10b981',
    Charging: '#3b82f6',
    Preparing: '#8b5cf6',
    Finishing: '#8b5cf6',
    SuspendedEVSE: '#f59e0b',
    SuspendedEV: '#f59e0b',
    Reserved: '#f59e0b',
    Unavailable: '#94a3b8',
    Faulted: '#f43f5e',
    Offline: '#64748b',
  }
  return map[status] ?? '#94a3b8'
}

export function getStatusChartColor(status: string): string {
  const map: Record<string, string> = {
    Available: '#10b981',
    Charging: '#3b82f6',
    Preparing: '#8b5cf6',
    Finishing: '#8b5cf6',
    SuspendedEVSE: '#f59e0b',
    SuspendedEV: '#f59e0b',
    Reserved: '#f59e0b',
    Unavailable: '#94a3b8',
    Faulted: '#f43f5e',
    Offline: '#64748b',
  }
  return map[status] ?? '#94a3b8'
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
