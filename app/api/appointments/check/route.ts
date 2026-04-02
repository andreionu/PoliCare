import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/appointments/check?doctorId=X&date=YYYY-MM-DD&startTime=HH:MM&endTime=HH:MM&excludeId=X
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get("doctorId")
    const date = searchParams.get("date")
    const startTime = searchParams.get("startTime")
    const endTime = searchParams.get("endTime")
    const excludeId = searchParams.get("excludeId")

    if (!doctorId || !date || !startTime || !endTime) {
      return NextResponse.json({ available: false, reason: "Parametri lipsă" }, { status: 400 })
    }

    // 1. Check doctor status
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { status: true, name: true },
    })

    if (!doctor) {
      return NextResponse.json({ available: false, reason: "Medicul nu a fost găsit" })
    }

    if (doctor.status === "IN_CONCEDIU") {
      return NextResponse.json({ available: false, reason: `Dr. ${doctor.name} este în concediu` })
    }

    if (doctor.status === "INDISPONIBIL") {
      return NextResponse.json({ available: false, reason: `Dr. ${doctor.name} este indisponibil` })
    }

    // 2. Check doctor schedule for that day-of-week
    const appointmentDate = new Date(date)
    const dayOfWeek = appointmentDate.getDay() // 0=Sun, 1=Mon ...

    const schedule = await prisma.doctorSchedule.findUnique({
      where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
    })

    if (schedule) {
      if (!schedule.isActive) {
        return NextResponse.json({ available: false, reason: "Medicul nu lucrează în această zi" })
      }
      // Check time window
      if (startTime < schedule.startTime || endTime > schedule.endTime) {
        return NextResponse.json({
          available: false,
          reason: `Medicul lucrează ${schedule.startTime}–${schedule.endTime} în această zi`,
        })
      }
    }
    // If no schedule set for that day, we allow (schedule not configured yet)

    // 3. Check for overlapping appointments
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const conflictWhere: Parameters<typeof prisma.appointment.findFirst>[0] = {
      where: {
        doctorId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["ANULAT", "NEPREZENTARE"] },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    }

    const conflict = await prisma.appointment.findFirst(conflictWhere)

    if (conflict) {
      return NextResponse.json({
        available: false,
        reason: `Medicul are deja o programare la ${conflict.startTime}–${conflict.endTime}`,
      })
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error("Error checking availability:", error)
    return NextResponse.json({ available: false, reason: "Eroare la verificare" }, { status: 500 })
  }
}
