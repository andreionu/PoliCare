import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const encoder = new TextEncoder()
  let intervalId: ReturnType<typeof setInterval>

  const stream = new ReadableStream({
    start(controller) {
      const tick = async () => {
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
          const payload = JSON.stringify({
            pendingAppointments,
            serverTime: new Date().toISOString(),
          })
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
        } catch {
          controller.enqueue(
            encoder.encode(`event: error\ndata: {"error":"db_unavailable"}\n\n`)
          )
        }
      }

      tick()
      intervalId = setInterval(tick, 5_000)
    },
    cancel() {
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
