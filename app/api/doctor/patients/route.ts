import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

function computePatientStatus(appointments: { date: Date; status: string }[]): string {
  if (appointments.length === 0) return "NOU"

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const hasFuture = appointments.some(
    (a) => new Date(a.date) >= today && (a.status === "CONFIRMAT" || a.status === "PROGRAMAT")
  )
  if (hasFuture) return "PROGRAMAT"

  const past = appointments
    .filter((a) => new Date(a.date) < today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (past.length === 0) return "NOU"

  const daysSinceLast = now.getTime() - new Date(past[0].date).getTime()
  return daysSinceLast <= NINETY_DAYS_MS ? "ACTIV" : "INACTIV"
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "DOCTOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const doctorId = session.user.doctorId
  if (!doctorId) return NextResponse.json({ message: "Profilul de medic nu a fost găsit" }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const PAGE_SIZE = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)))
  const search = searchParams.get("search")?.trim() ?? ""

  const where = {
    OR: [
      { primaryDoctorId: doctorId },
      { appointments: { some: { doctorId } } },
    ] as any[],
    ...(search
      ? {
          AND: [
            {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            },
          ],
        }
      : {}),
  }

  const [total, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        birthDate: true,
        gender: true,
        _count: { select: { appointments: true, medicalRecords: true } },
        appointments: { select: { date: true, status: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])

  const data = patients.map(({ appointments, ...p }) => ({
    ...p,
    status: computePatientStatus(appointments),
  }))

  return NextResponse.json({ data, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) })
}
