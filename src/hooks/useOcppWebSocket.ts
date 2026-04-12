import { useEffect, useRef, useState, useCallback } from 'react'

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface OcppLiveMessage {
  id: string
  raw: unknown[]
  messageType: number
  action?: string
  chargePointId?: string
  payload?: unknown
  receivedAt: string
}

interface UseOcppWebSocketOptions {
  /** Auto-reconnect interval in ms. Set 0 to disable. */
  reconnectInterval?: number
  /** Max messages to keep in the buffer */
  maxMessages?: number
}

const WS_URL = (import.meta.env.VITE_WS_URL as string) || 'ws://localhost:8080/ocpp/CP001'

export function useOcppWebSocket(options: UseOcppWebSocketOptions = {}) {
  const { reconnectInterval = 5000, maxMessages = 100 } = options

  const [status, setStatus] = useState<WsStatus>('disconnected')
  const [messages, setMessages] = useState<OcppLiveMessage[]>([])
  const [lastMessage, setLastMessage] = useState<OcppLiveMessage | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return

    setStatus('connecting')

    try {
      // Use the native browser WebSocket API — no npm package needed
      const ws = new WebSocket(WS_URL, ['ocpp1.6'])
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        setStatus('connected')
        clearTimer()
      }

      ws.onmessage = (event: MessageEvent) => {
        if (!mountedRef.current) return
        try {
          const raw = JSON.parse(event.data as string) as unknown[]
          if (!Array.isArray(raw)) return

          const [msgType, msgId, ...rest] = raw
          const msg: OcppLiveMessage = {
            id: String(msgId ?? Date.now()),
            raw,
            messageType: Number(msgType),
            receivedAt: new Date().toISOString(),
            // Type 2 = Call: [2, id, action, payload]
            // Type 3 = CallResult: [3, id, payload]
            // Type 4 = CallError: [4, id, code, desc, details]
            action: msgType === 2 ? String(rest[0] ?? '') : undefined,
            payload: msgType === 2 ? rest[1] : rest[0],
          }

          setLastMessage(msg)
          setMessages((prev) => [msg, ...prev].slice(0, maxMessages))
        } catch {
          // Ignore unparseable messages
        }
      }

      ws.onerror = () => {
        if (!mountedRef.current) return
        setStatus('error')
      }

      ws.onclose = (event) => {
        if (!mountedRef.current) return
        setStatus('disconnected')
        wsRef.current = null

        // Auto-reconnect unless cleanly closed (code 1000)
        if (reconnectInterval > 0 && event.code !== 1000) {
          timerRef.current = setTimeout(connect, reconnectInterval)
        }
      }
    } catch {
      setStatus('error')
      if (reconnectInterval > 0) {
        timerRef.current = setTimeout(connect, reconnectInterval)
      }
    }
  }, [reconnectInterval, maxMessages])

  const disconnect = useCallback(() => {
    clearTimer()
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
      wsRef.current = null
    }
    setStatus('disconnected')
  }, [])

  const clearMessages = useCallback(() => setMessages([]), [])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      clearTimer()
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount')
        wsRef.current = null
      }
    }
  }, [connect])

  return { status, messages, lastMessage, connect, disconnect, clearMessages }
}
