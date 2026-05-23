import { prisma } from "@/lib/prisma"
import { onAppEvent, AppEvent } from "@/lib/event-bus"

export const dynamic = "force-dynamic"

const PUSH_EVENTS: AppEvent[] = ["appointments_updated", "payment_updated", "stats_updated"]

export async function GET() {
  const encoder = new TextEncoder()

  let controller: ReadableStreamDefaultController | null = null
  let isClosed = false
  let heartbeatId: ReturnType<typeof setInterval>
  const offHandlers: Array<() => void> = []

  const send = (event: string, data: Record<string, unknown>) => {
    if (isClosed || !controller) return
    try {
      controller.enqueue(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      )
    } catch {
      // stream already closed
    }
  }

  const pushNotifications = async () => {
    if (isClosed) return
    try {
      const pendingAppointments = await prisma.appointment.findMany({
        where: { status: "IN_ASTEPTARE" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          createdAt: true,
          date: true,
          startTime: true,
          patient: { select: { name: true } },
          doctor: { select: { name: true } },
        },
      })
      send("notifications", {
        pendingAppointments,
        serverTime: new Date().toISOString(),
      })
    } catch {
      send("error", { error: "db_unavailable" })
    }
  }

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl

      // Initial push
      pushNotifications()

      // Subscribe to server-side mutation events → immediate push
      for (const event of PUSH_EVENTS) {
        const off = onAppEvent(event, (payload) => {
          send(event, { ...payload, ts: new Date().toISOString() })
          // Also refresh the notifications bell count
          if (event === "appointments_updated") pushNotifications()
        })
        offHandlers.push(off)
      }

      // Heartbeat every 30s — keeps connection alive and refreshes bell
      heartbeatId = setInterval(() => {
        send("heartbeat", { ts: new Date().toISOString() })
        pushNotifications()
      }, 30_000)
    },
    cancel() {
      isClosed = true
      clearInterval(heartbeatId)
      offHandlers.forEach((off) => off())
      controller = null
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
