export type ChargePointStatus =
  | 'Available'
  | 'Preparing'
  | 'Charging'
  | 'SuspendedEVSE'
  | 'SuspendedEV'
  | 'Finishing'
  | 'Reserved'
  | 'Unavailable'
  | 'Faulted'
  | 'Offline'

export interface ChargePoint {
  id: string
  chargePointId: string
  vendor?: string
  model?: string
  firmwareVersion?: string
  iccid?: string
  imsi?: string
  status: ChargePointStatus
  lastSeen?: string
  createdAt?: string
  updatedAt?: string
  connectors?: Connector[]
}

export interface Connector {
  connectorId: number
  status: ChargePointStatus
}

export interface StatusHistory {
  id: number | string
  chargePointId: string
  connectorId?: number
  status: ChargePointStatus
  errorCode?: string
  info?: string
  timestamp: string
}

export interface MeterValue {
  id: number | string
  chargePointId: string
  transactionId?: number
  connectorId?: number
  measurand?: string
  value: number | string
  unit?: string
  context?: string
  timestamp: string
}

export interface Transaction {
  id: number | string
  chargePointId: string
  connectorId?: number
  idTag?: string
  startTime: string
  stopTime?: string
  meterStart?: number
  meterStop?: number
  stopReason?: string
  status?: string
  energyConsumed?: number
}

export interface TransactionOverview {
  total: number
  active: number
  completed: number
  totalEnergy: number
  avgEnergy: number
}

export interface StatsOverview {
  totalChargePoints: number
  onlineChargePoints: number
  offlineChargePoints: number
  chargingChargePoints: number
  totalTransactions: number
  activeTransactions: number
  totalEnergy: number
  avgEnergyPerSession: number
}

export interface EnergyDataPoint {
  date: string
  energy: number
}

export interface SessionDataPoint {
  date: string
  sessions: number
  count?: number
}

export interface PowerDataPoint {
  timestamp: string
  power: number
  chargePointId?: string
}

export interface StatusDistributionItem {
  status: string
  count: number
}

export interface AvailabilityDataPoint {
  date: string
  availability: number
  uptime?: number
}

export interface OcppMessage {
  id: number | string
  chargePointId: string
  action?: string
  messageType?: string | number
  direction?: 'in' | 'out' | 'IN' | 'OUT'
  payload?: unknown
  rawMessage?: string
  timestamp: string
}

export interface HealthStatus {
  status: string
  uptime?: number
  timestamp?: string
  version?: string
  database?: string
  websocket?: string
}

export interface AiForecast {
  forecast?: EnergyDataPoint[]
  predictedEnergy?: number
  confidence?: number
  period?: string
  message?: string
}

export interface AiAnomaly {
  anomalies?: Array<{
    chargePointId: string
    type: string
    severity: string
    timestamp: string
    description?: string
  }>
  totalDetected?: number
  message?: string
}
