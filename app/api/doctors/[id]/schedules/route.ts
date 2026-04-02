import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/doctors/[id]/schedules
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId: id },
      orderBy: { dayOfWeek: "asc" },
    })
    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 })
  }
}

// PUT /api/doctors/[id]/schedules
// Expects: { schedules: Array<{ dayOfWeek: number, startTime: string, endTime: string, isActive: boolean }> }
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { schedules } = body as {
      schedules: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }>
    }

    if (!Array.isArray(schedules)) {
      return NextResponse.json({ error: "schedules array is required" }, { status: 400 })
    }

    // Upsert each day using the unique constraint [doctorId, dayOfWeek]
    const results = await Promise.all(
      schedules.map((s) =>
        prisma.doctorSchedule.upsert({
          where: { doctorId_dayOfWeek: { doctorId: id, dayOfWeek: s.dayOfWeek } },
          update: { startTime: s.startTime, endTime: s.endTime, isActive: s.isActive },
          create: { doctorId: id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, isActive: s.isActive },
        })
      )
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error saving schedules:", error)
    return NextResponse.json({ error: "Failed to save schedules" }, { status: 500 })
  }
}
