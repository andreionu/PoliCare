import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendAppointmentNotification } from "@/lib/notifications"

// GET /api/appointments/[id] - Get single appointment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        department: true,
        service: true,
        medicalRecord: true,
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error fetching appointment:", error)
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    )
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Conflict check only when time/date/doctor is changing
    if (body.date || body.startTime || body.endTime || body.doctorId) {
      const current = await prisma.appointment.findUnique({ where: { id }, select: { doctorId: true, date: true, startTime: true, endTime: true } })
      if (current) {
        const checkDoctorId = body.doctorId || current.doctorId
        const checkDate = body.date ? new Date(body.date) : current.date
        const checkStart = body.startTime || current.startTime
        const checkEnd = body.endTime || current.endTime

        const doctor = await prisma.doctor.findUnique({ where: { id: checkDoctorId }, select: { status: true, name: true } })
        if (doctor?.status === "IN_CONCEDIU") {
          return NextResponse.json({ error: "CONFLICT", message: `Dr. ${doctor.name} este în concediu` }, { status: 409 })
        }
        if (doctor?.status === "INDISPONIBIL") {
          return NextResponse.json({ error: "CONFLICT", message: `Dr. ${doctor.name} este indisponibil` }, { status: 409 })
        }

        const startOfDay = new Date(checkDate); startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(checkDate); endOfDay.setHours(23, 59, 59, 999)
        const conflict = await prisma.appointment.findFirst({
          where: {
            doctorId: checkDoctorId,
            date: { gte: startOfDay, lte: endOfDay },
            status: { notIn: ["ANULAT", "NEPREZENTARE"] },
            id: { not: id },
            AND: [{ startTime: { lt: checkEnd } }, { endTime: { gt: checkStart } }],
          },
        })
        if (conflict) {
          return NextResponse.json(
            { error: "CONFLICT", message: `Medicul are deja o programare la ${conflict.startTime}–${conflict.endTime}` },
            { status: 409 }
          )
        }
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        startTime: body.startTime,
        endTime: body.endTime,
        duration: body.duration,
        status: body.status,
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

    // Trigger notifications on status transitions (fire-and-forget)
    const notifyStatuses = ["CONFIRMAT", "ANULAT"] as const
    type NotifyStatus = typeof notifyStatuses[number]
    if (
      body.status &&
      (notifyStatuses as readonly string[]).includes(body.status) &&
      (body.sendEmail !== undefined || body.sendSMS !== undefined)
    ) {
      const event = (body.status as NotifyStatus) === "CONFIRMAT" ? "CONFIRMATION" : "CANCELLATION"
      void sendAppointmentNotification(
        {
          id: appointment.id,
          date: appointment.date,
          startTime: appointment.startTime,
          patient: {
            name: appointment.patient.name,
            email: appointment.patient.email ?? null,
            phone: appointment.patient.phone,
          },
          doctor: { name: appointment.doctor.name },
          department: appointment.department ? { name: appointment.department.name } : null,
        },
        event,
        {
          sendEmail: body.sendEmail ?? false,
          sendSMS: body.sendSMS ?? false,
        }
      )
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    )
  }
}

// DELETE /api/appointments/[id] - Delete appointment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.appointment.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Appointment deleted" })
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    )
  }
}
