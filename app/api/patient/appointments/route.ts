import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "PATIENT") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const patientId = session.user.patientId
  if (!patientId) return NextResponse.json({ message: "Profilul de pacient nu a fost găsit" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  const where: any = { patientId }
  if (status && status !== "all") where.status = status

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      doctor: { select: { name: true, specialty: true } },
      department: { select: { name: true } },
      service: { select: { name: true, price: true } },
    },
    orderBy: [{ date: "desc" }, { startTime: "asc" }],
  })

  return NextResponse.json(appointments)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "PATIENT") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const patientId = session.user.patientId
  if (!patientId) return NextResponse.json({ message: "Profilul de pacient nu a fost găsit" }, { status: 404 })

  try {
    const body = await request.json()
    const { doctorId, departmentId, serviceId, date, startTime, endTime, duration, notes } = body

    if (!doctorId || !departmentId || !date || !startTime || !endTime) {
      return NextResponse.json({ message: "Câmpuri obligatorii lipsă" }, { status: 400 })
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { status: true, name: true } })
    if (!doctor) return NextResponse.json({ message: "Medicul nu a fost găsit" }, { status: 404 })
    if (doctor.status === "IN_CONCEDIU") return NextResponse.json({ message: `Dr. ${doctor.name} este în concediu` }, { status: 409 })
    if (doctor.status === "INDISPONIBIL") return NextResponse.json({ message: `Dr. ${doctor.name} este indisponibil` }, { status: 409 })

    const apptDate = new Date(date)
    const startOfDay = new Date(apptDate); startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(apptDate); endOfDay.setHours(23, 59, 59, 999)

    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["ANULAT", "NEPREZENTARE"] },
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    })
    if (conflict) {
      return NextResponse.json({ message: `Medicul are deja o programare la ${conflict.startTime}–${conflict.endTime}` }, { status: 409 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        date: apptDate,
        startTime,
        endTime,
        duration: duration ?? 30,
        status: "IN_ASTEPTARE",
        notes: notes ?? null,
        patientId,
        doctorId,
        departmentId,
        serviceId: serviceId ?? null,
      },
      include: {
        doctor: { select: { name: true, specialty: true } },
        department: { select: { name: true } },
        service: { select: { name: true, price: true } },
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch {
    return NextResponse.json({ message: "Eroare la creare programare" }, { status: 500 })
  }
}
