import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/appointments - Get all appointments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const doctorId = searchParams.get("doctorId")
    const patientId = searchParams.get("patientId")
    const date = searchParams.get("date")

    // Build filter
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (doctorId) where.doctorId = doctorId
    if (patientId) where.patientId = patientId
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        service: true,
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    )
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // --- Conflict detection ---
    const doctor = await prisma.doctor.findUnique({ where: { id: body.doctorId }, select: { status: true, name: true } })
    if (doctor?.status === "IN_CONCEDIU") {
      return NextResponse.json({ error: "CONFLICT", message: `Dr. ${doctor.name} este în concediu` }, { status: 409 })
    }
    if (doctor?.status === "INDISPONIBIL") {
      return NextResponse.json({ error: "CONFLICT", message: `Dr. ${doctor.name} este indisponibil` }, { status: 409 })
    }

    const startOfDay = new Date(body.date); startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(body.date); endOfDay.setHours(23, 59, 59, 999)
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: body.doctorId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["ANULAT", "NEPREZENTARE"] },
        AND: [{ startTime: { lt: body.endTime } }, { endTime: { gt: body.startTime } }],
      },
    })
    if (conflict) {
      return NextResponse.json(
        { error: "CONFLICT", message: `Medicul are deja o programare la ${conflict.startTime}–${conflict.endTime}` },
        { status: 409 }
      )
    }
    // --- End conflict detection ---

    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        duration: body.duration || 30,
        status: body.status || "IN_ASTEPTARE",
        type: body.type,
        notes: body.notes,
        patientId: body.patientId,
        doctorId: body.doctorId,
        departmentId: body.departmentId,
        serviceId: body.serviceId,
      },
      include: {
        patient: true,
        doctor: true,
        department: true,
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    )
  }
}
