import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const DEFAULT_SETTINGS = {
  id: "clinic_settings",
  clinicName: "Policare",
  clinicPhone: "",
  clinicEmail: "",
  clinicAddress: "",
  emailNotifications: true,
  smsNotifications: false,
  defaultAppointmentDuration: 30,
  workdayStart: "08:00",
  workdayEnd: "18:00",
  workingDays: "0,1,2,3,4",
  reminderEnabled: true,
  reminderHoursBefore: 24,
}

export async function GET() {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: "clinic_settings" },
      update: {},
      create: DEFAULT_SETTINGS,
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    const data: Record<string, unknown> = {}
    if (body.clinicName !== undefined) data.clinicName = body.clinicName
    if (body.clinicPhone !== undefined) data.clinicPhone = body.clinicPhone
    if (body.clinicEmail !== undefined) data.clinicEmail = body.clinicEmail
    if (body.clinicAddress !== undefined) data.clinicAddress = body.clinicAddress
    if (body.emailNotifications !== undefined) data.emailNotifications = body.emailNotifications
    if (body.smsNotifications !== undefined) data.smsNotifications = body.smsNotifications
    if (body.defaultAppointmentDuration !== undefined) data.defaultAppointmentDuration = body.defaultAppointmentDuration
    if (body.workdayStart !== undefined) data.workdayStart = body.workdayStart
    if (body.workdayEnd !== undefined) data.workdayEnd = body.workdayEnd
    if (body.workingDays !== undefined) data.workingDays = body.workingDays
    if (body.reminderEnabled !== undefined) data.reminderEnabled = body.reminderEnabled
    if (body.reminderHoursBefore !== undefined) data.reminderHoursBefore = body.reminderHoursBefore

    const settings = await prisma.settings.upsert({
      where: { id: "clinic_settings" },
      update: data,
      create: { ...DEFAULT_SETTINGS, ...data },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
