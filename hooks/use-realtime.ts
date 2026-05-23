"use client"

import { useEffect, useRef } from "react"

type AppEvent = "appointments_updated" | "payment_updated" | "stats_updated"

/**
 * Calls `callback` whenever the given server-side mutation event fires.
 * Requires the SSE connection in `useNotifications` to be mounted (it lives
 * in the header, so it's always present in the admin layout).
 */
export function useRealtimeEvent(event: AppEvent, callback: () => void) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    const handler = () => cbRef.current()
    window.addEventListener(`app:${event}`, handler)
    return () => window.removeEventListener(`app:${event}`, handler)
  }, [event])
}
