import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendAppointmentNotification } from "@/lib/notifications"

// POST /api/notifications/reminders
// Body (optional): { appointmentId: string } — targets a single appointment
// Without body: processes all eligible upcoming confirmed appointments
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    const settings = await prisma.settings.findUnique({
      where: { id: "clinic_settings" },
      select: {
        reminderEnabled: true,
        reminderHoursBefore: true,
        emailNotifications: true,
        smsNotifications: true,
      },
    })

    if (!settings?.reminderEnabled) {
      return NextResponse.json({ message: "Reminders disabled in settings", sent: 0 })
    }

    const hoursBefore = settings.reminderHoursBefore ?? 24
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const windowEnd = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000)

    // Base query: confirmed appointments with no successful reminder yet
    const baseWhere = {
      status: "CONFIRMAT" as const,
      notifications: {
        none: { event: "REMINDER" as const, status: "SENT" as const },
      },
    }

    const appointments = await prisma.appointment.findMany({
      where: body.appointmentId
        ? { ...baseWhere, id: body.appointmentId }
        : { ...baseWhere, date: { gte: today, lte: windowEnd } },
      include: {
        patient: true,
        doctor: true,
        department: true,
      },
    })

    const emailOpt = body.sendEmail !== undefined ? body.sendEmail : settings.emailNotifications
    const smsOpt = body.sendSMS !== undefined ? body.sendSMS : settings.smsNotifications

    const eligible = appointments.filter((appt) => {
      const aptDate = new Date(appt.date)
      const [hours, minutes] = appt.startTime.split(":").map(Number)
      aptDate.setHours(hours, minutes, 0, 0)
      return aptDate >= now
    })

    if (!emailOpt && !smsOpt) {
      return NextResponse.json({ message: "0 reminder(e) trimise", sent: 0 })
    }

    const results = await Promise.all(
      eligible.map((appt) =>
        sendAppointmentNotification(
          {
            id: appt.id,
            date: appt.date,
            startTime: appt.startTime,
            patient: { name: appt.patient.name, email: appt.patient.email ?? null, phone: appt.patient.phone },
            doctor: { name: appt.doctor.name },
            department: appt.department ? { name: appt.department.name } : null,
          },
          "REMINDER",
          { sendEmail: emailOpt, sendSMS: smsOpt }
        ).then(() => true).catch(() => false)
      )
    )

    const sent = results.filter(Boolean).length
    return NextResponse.json({ message: `${sent} reminder(e) trimise`, sent })
  } catch (error) {
    console.error("Error sending reminders:", error)
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 })
  }
}
