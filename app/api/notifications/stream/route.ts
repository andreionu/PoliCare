import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const encoder = new TextEncoder()
  let intervalId: ReturnType<typeof setInterval>
  let isClosed = false

  const stream = new ReadableStream({
    start(controller) {
      const tick = async () => {
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
          
          if (isClosed) return

          const payload = JSON.stringify({
            pendingAppointments,
            serverTime: new Date().toISOString(),
          })
          
          try {
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
          } catch (e) {
            // ignore if closed exactly at this tick
          }
        } catch {
          if (isClosed) return
          try {
            controller.enqueue(
              encoder.encode(`event: error\ndata: {"error":"db_unavailable"}\n\n`)
            )
          } catch (e) {
            // ignore
          }
        }
      }

      tick()
      intervalId = setInterval(tick, 5_000)
    },
    cancel() {
      isClosed = true
      clearInterval(intervalId)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  })
}
