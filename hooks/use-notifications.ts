"use client"

import { useEffect, useRef, useState, useMemo } from "react"

interface PendingAppointment {
  id: string
  createdAt: string
  date: string
  startTime: string
  patient: { name: string }
  doctor: { name: string }
}

const SEEN_KEY = "notifications_seen_at"

export function useNotifications() {
  const [appointments, setAppointments] = useState<PendingAppointment[]>([])
  const [seenAt, setSeenAt] = useState<string>(() =>
    typeof window !== "undefined" ? (localStorage.getItem(SEEN_KEY) ?? "0") : "0"
  )
  const lastServerTime = useRef<string>("0")
  const esRef = useRef<EventSource | null>(null)

  const connect = () => {
    if (esRef.current) esRef.current.close()
    const es = new EventSource("/api/notifications/stream")
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setAppointments(data.pendingAppointments ?? [])
      lastServerTime.current = data.serverTime
    }
    esRef.current = es
  }

  useEffect(() => {
    connect()
    const onVisibility = () => {
      if (document.visibilityState === "visible") connect()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      esRef.current?.close()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SEEN_KEY && e.newValue) setSeenAt(e.newValue)
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const unreadCount = useMemo(
    () => appointments.filter((a) => new Date(a.createdAt) > new Date(seenAt)).length,
    [appointments, seenAt]
  )

  const markAllSeen = () => {
    const t = lastServerTime.current || new Date().toISOString()
    localStorage.setItem(SEEN_KEY, t)
    setSeenAt(t)
  }

  return { appointments, unreadCount, markAllSeen }
}
