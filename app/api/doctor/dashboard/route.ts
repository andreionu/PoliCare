import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { applyExpiredStatuses } from "@/lib/appointment-utils"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "DOCTOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const doctorId = session.user.doctorId
  if (!doctorId) return NextResponse.json({ message: "Profilul de medic nu a fost găsit" }, { status: 404 })

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [todayAppointments, weekCount] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId,
        date: { gte: todayStart, lt: todayEnd },
        status: { not: "ANULAT" },
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        department: { select: { name: true } },
        service: { select: { name: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.appointment.count({
      where: {
        doctorId,
        date: { gte: todayStart, lt: weekEnd },
        status: { not: "ANULAT" },
      },
    }),
  ])

  const todayWithExpired = applyExpiredStatuses(todayAppointments)

  return NextResponse.json({
    todayCount: todayWithExpired.length,
    weekCount,
    todayAppointments: todayWithExpired,
  })
}
