import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { applyExpiredStatuses } from "@/lib/appointment-utils"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "DOCTOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const doctorId = session.user.doctorId
  if (!doctorId) return NextResponse.json({ message: "Profilul de medic nu a fost găsit" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const date = searchParams.get("date")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 20

  const where: any = { doctorId }
  // "INCHEIATA" is a computed status — query all non-terminal statuses instead
  if (status && status !== "all" && status !== "INCHEIATA") where.status = status
  if (date) {
    const d = new Date(date)
    const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    where.date = { gte: d, lt: nextDay }
  }

  const [raw, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        department: { select: { name: true } },
        service: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.appointment.count({ where }),
  ])

  let appointments = applyExpiredStatuses(raw)
  if (status === "INCHEIATA") appointments = appointments.filter((a) => a.status === "INCHEIATA")

  return NextResponse.json({ appointments, total, page, pageSize })
}
