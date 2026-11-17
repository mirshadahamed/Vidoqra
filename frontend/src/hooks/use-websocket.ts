"use client"

import { useEffect, useRef, useCallback } from "react"
import { useDownloadStore } from "@/stores/download-store"
import { api } from "@/services/api"

export function useJobWebSocket(jobId?: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const isMountedRef = useRef<boolean>(true)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Stable references to store actions
  const updateJobProgress = useDownloadStore((s) => s.updateJobProgress)
  const setWsConnected = useDownloadStore((s) => s.setWsConnected)
  const isWsConnected = useDownloadStore((s) => s.wsConnected)

  const updateProgressRef = useRef(updateJobProgress)
  updateProgressRef.current = updateJobProgress

  const setConnectedRef = useRef(setWsConnected)
  setConnectedRef.current = setWsConnected

  const pollFallback = useCallback(async () => {
    if (!jobId || !isMountedRef.current) return
    try {
      const job = await api.getJobStatus(jobId)
      if (!isMountedRef.current) return
      updateProgressRef.current(
        job.jobId,
        job.progress,
        job.status,
        job.speed,
        job.eta,
        job.error,
        job.downloadUrl,
        job.downloadToken
      )
      if (job.status === "Completed" || job.status === "Failed" || job.status === "Cancelled") {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    } catch {
      // Ignored during polling
    }
  }, [jobId])

  const pollFallbackRef = useRef(pollFallback)
  pollFallbackRef.current = pollFallback

  useEffect(() => {
    isMountedRef.current = true

    const connectWebSocket = () => {
      if (!isMountedRef.current) return

      try {
        const wsUrl = api.getWebSocketUrl(jobId)
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (!isMountedRef.current) {
            try { ws.close(1000, "Unmounted") } catch {}
            return
          }
          setConnectedRef.current(true)

          // Stop fallback polling if active
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }

          // Start heartbeat ping
          if (!pingIntervalRef.current) {
            pingIntervalRef.current = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                try { ws.send("ping") } catch {}
              }
            }, 25000)
          }
        }

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return
          if (event.data === "pong") return
          try {
            const data = JSON.parse(event.data)
            if (data && data.jobId) {
              updateProgressRef.current(
                data.jobId,
                data.progress ?? 0,
                data.status,
                data.speed,
                data.eta,
                data.error,
                data.downloadUrl,
                data.downloadToken
              )
            }
          } catch {
            // Non-JSON message
          }
        }

        ws.onerror = () => {
          if (!isMountedRef.current) return
          setConnectedRef.current(false)
          // Trigger polling fallback for targeted job
          if (!pollingIntervalRef.current && jobId) {
            pollingIntervalRef.current = setInterval(() => pollFallbackRef.current(), 2500)
          }
        }

        ws.onclose = (event) => {
          if (!isMountedRef.current) return
          setConnectedRef.current(false)

          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current)
            pingIntervalRef.current = null
          }

          // Reconnect with backoff if not closed cleanly
          if (event.code !== 1000 && !reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null
              connectWebSocket()
            }, 3000)
          }
        }
      } catch {
        if (!isMountedRef.current) return
        setConnectedRef.current(false)
        if (!pollingIntervalRef.current && jobId) {
          pollingIntervalRef.current = setInterval(() => pollFallbackRef.current(), 2500)
        }
      }
    }

    connectWebSocket()

    return () => {
      isMountedRef.current = false

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }

      const ws = wsRef.current
      if (ws) {
        // Prevent "WebSocket is closed before the connection is established" warning in React StrictMode
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => {
            try { ws.close(1000, "Clean unmount") } catch {}
          }
          ws.onerror = null
          ws.onclose = null
          ws.onmessage = null
        } else if (ws.readyState === WebSocket.OPEN) {
          try { ws.close(1000, "Clean unmount") } catch {}
        }
        wsRef.current = null
      }
    }
  }, [jobId])

  return { isConnected: isWsConnected }
}
