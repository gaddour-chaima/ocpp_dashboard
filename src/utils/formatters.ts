import { format, formatDistanceToNow, parseISO, differenceInSeconds } from 'date-fns'

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy HH:mm')
  } catch {
    return dateStr
  }
}

export function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

export function formatDuration(startStr: string | null, endStr: string | null): string {
  if (!startStr) return '—'
  try {
    const start = parseISO(startStr)
    const end = endStr ? parseISO(endStr) : new Date()
    const seconds = differenceInSeconds(end, start)
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  } catch {
    return '—'
  }
}

export function formatEnergy(wh: number | null | undefined, decimals = 2): string {
  if (wh == null) return '—'
  if (wh >= 1_000_000) return `${(wh / 1_000_000).toFixed(decimals)} MWh`
  if (wh >= 1_000) return `${(wh / 1_000).toFixed(decimals)} kWh`
  return `${wh.toFixed(decimals)} Wh`
}

export function formatPower(w: number | null | undefined, decimals = 1): string {
  if (w == null) return '—'
  if (w >= 1_000_000) return `${(w / 1_000_000).toFixed(decimals)} MW`
  if (w >= 1_000) return `${(w / 1_000).toFixed(decimals)} kW`
  return `${w.toFixed(decimals)} W`
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString()
}
