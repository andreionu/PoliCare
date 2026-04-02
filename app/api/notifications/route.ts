import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/notifications?appointmentId=X
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get("appointmentId")

    const notifications = await prisma.notification.findMany({
      where: appointmentId ? { appointmentId } : undefined,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
