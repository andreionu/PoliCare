import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "PATIENT") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const patientId = session.user.patientId
  if (!patientId) return NextResponse.json({ message: "Profilul de pacient nu a fost găsit" }, { status: 404 })

  const now = new Date()

  const [upcomingAppointments, recentNotifications] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        patientId,
        date: { gte: now },
        status: { notIn: ["ANULAT", "NEPREZENTARE"] },
      },
      include: {
        doctor: { select: { name: true, specialty: true } },
        department: { select: { name: true } },
      },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.notification.findMany({
      where: {
        appointment: { patientId },
      },
      include: {
        appointment: { select: { date: true, startTime: true } },
      },
      orderBy: { sentAt: "desc" },
      take: 5,
    }),
  ])

  return NextResponse.json({ upcomingAppointments, recentNotifications })
}
