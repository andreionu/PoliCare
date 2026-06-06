import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendAppointmentNotification } from "@/lib/notifications"
import { emitAppEvent } from "@/lib/event-bus"
import { logActivity } from "@/lib/activity"
import { applyExpiredStatuses } from "@/lib/appointment-utils"

// GET /api/appointments - Get all appointments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const doctorId = searchParams.get("doctorId")
    const patientId = searchParams.get("patientId")
    const date = searchParams.get("date")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    // Build filter
    const where: Record<string, unknown> = {}
    if (status && status !== "INCHEIATA") where.status = status
    if (doctorId) where.doctorId = doctorId
    if (patientId) where.patientId = patientId
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      where.date = { gte: startOfDay, lte: endOfDay }
    } else if (from || to) {
      const dateFilter: Record<string, Date> = {}
      if (from) { const d = new Date(from); d.setHours(0, 0, 0, 0); dateFilter.gte = d }
      if (to) { const d = new Date(to); d.setHours(23, 59, 59, 999); dateFilter.lte = d }
      where.date = dateFilter
    } else if (!patientId && !doctorId) {
      // Default: load 60 days back + 60 days forward to avoid dumping entire table
      const past = new Date(); past.setDate(past.getDate() - 60); past.setHours(0, 0, 0, 0)
      const future = new Date(); future.setDate(future.getDate() + 60); future.setHours(23, 59, 59, 999)
      where.date = { gte: past, lte: future }
    }

    const pageParam = searchParams.get("page")
    const paginated = pageParam !== null
    const page = Math.max(1, parseInt(pageParam ?? "1"))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50")))

    const include = {
      patient: { select: { id: true, name: true, phone: true, email: true } },
      doctor: { select: { id: true, name: true, specialty: true } },
      department: { select: { id: true, name: true, color: true } },
      service: true,
      notifications: { orderBy: { createdAt: "desc" as const }, take: 10 },
    }
    const orderBy = [{ date: "asc" as const }, { startTime: "asc" as const }]

    if (!paginated) {
      const raw = await prisma.appointment.findMany({ where, include, orderBy })
      let appointments = applyExpiredStatuses(raw)
      if (status === "INCHEIATA") appointments = appointments.filter((a) => a.status === "INCHEIATA")
      return NextResponse.json(appointments)
    }

    const [raw, total] = await Promise.all([
      prisma.appointment.findMany({ where, include, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.appointment.count({ where }),
    ])
    let appointments = applyExpiredStatuses(raw)
    if (status === "INCHEIATA") appointments = appointments.filter((a) => a.status === "INCHEIATA")

    return NextResponse.json({ data: appointments, total, page, totalPages: Math.ceil(total / limit) })
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
    const session = await getServerSession(authOptions)
    const body = await request.json()

    // --- Working hours and status validation ---
    const [settings, doctor] = await Promise.all([
      prisma.settings.findUnique({ where: { id: "clinic_settings" } }),
      prisma.doctor.findUnique({ where: { id: body.doctorId }, select: { status: true, name: true } })
    ])

    if (settings) {
      const date = new Date(body.date)
      const jsDay = date.getDay() // 0: Sun, 1: Mon...
      const adminDay = (jsDay + 6) % 7 // Map to 0: Lun, 6: Dum
      
      const isWorkingDay = settings.workingDays.split(",").includes(String(adminDay))
      if (!isWorkingDay) {
        return NextResponse.json({ error: "CONFLICT", message: "Clinica este închisă în această zi." }, { status: 409 })
      }

      if (body.startTime < settings.workdayStart || body.endTime > settings.workdayEnd) {
        return NextResponse.json({ 
          error: "CONFLICT", 
          message: `Programul clinicii este între ${settings.workdayStart} și ${settings.workdayEnd}.` 
        }, { status: 409 })
      }
    }

    if (doctor?.status === "IN_CONCEDIU") {
      return NextResponse.json({ error: "CONFLICT", message: `${doctor.name.replace(/^(Dr\.\s*)+/i, "Dr. ")} este în concediu` }, { status: 409 })
    }
    if (doctor?.status === "INDISPONIBIL") {
      return NextResponse.json({ error: "CONFLICT", message: `${doctor.name.replace(/^(Dr\.\s*)+/i, "Dr. ")} este indisponibil` }, { status: 409 })
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
    // --- End validation ---

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

    if (body.sendEmail || body.sendSMS) {
      void sendAppointmentNotification(
        {
          id: appointment.id,
          date: appointment.date,
          startTime: appointment.startTime,
          patient: {
            name: appointment.patient.name,
            email: appointment.patient.email,
            phone: appointment.patient.phone ?? "",
          },
          doctor: { name: appointment.doctor.name },
          department: appointment.department ? { name: appointment.department.name } : null,
        },
        "BOOKING_RECEIVED",
        { sendEmail: body.sendEmail ?? false, sendSMS: false } // Force false for SMS to save costs; SMS will be sent upon CONFIRMATION
      )
    }

    logActivity({
      action: "CREATE",
      entity: "appointment",
      entityId: appointment.id,
      description: `Programare creată: ${appointment.patient.name} → ${appointment.doctor.name} (${new Date(appointment.date).toLocaleDateString("ro-RO")} ${appointment.startTime})`,
      userId: session?.user?.id ?? undefined,
    })
    emitAppEvent("appointments_updated", { action: "created" })
    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    )
  }
}
