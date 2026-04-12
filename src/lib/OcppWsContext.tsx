import { createContext, useContext, ReactNode } from 'react'
import { useOcppWebSocket, type WsStatus, type OcppLiveMessage } from '@/hooks/useOcppWebSocket'

interface OcppWsContextValue {
  status: WsStatus
  messages: OcppLiveMessage[]
  lastMessage: OcppLiveMessage | null
  connect: () => void
  disconnect: () => void
  clearMessages: () => void
}

const OcppWsContext = createContext<OcppWsContextValue | null>(null)

export function OcppWsProvider({ children }: { children: ReactNode }) {
  const ws = useOcppWebSocket({ reconnectInterval: 5000, maxMessages: 200 })

  return (
    <OcppWsContext.Provider value={ws}>
      {children}
    </OcppWsContext.Provider>
  )
}

export function useOcppWs(): OcppWsContextValue {
  const ctx = useContext(OcppWsContext)
  if (!ctx) throw new Error('useOcppWs must be used within OcppWsProvider')
  return ctx
}
