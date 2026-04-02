import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())

    const [activities, todayCount, weekCount, activeUsersRaw] = await Promise.all([
      prisma.activityLog.findMany({
        include: {
          user: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.activityLog.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.activityLog.count({
        where: { createdAt: { gte: startOfWeek } },
      }),
      prisma.activityLog.findMany({
        where: { createdAt: { gte: startOfWeek }, userId: { not: null } },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ])

    return NextResponse.json({
      activities,
      todayCount,
      weekCount,
      activeUsers: activeUsersRaw.length,
    })
  } catch (error) {
    console.error("Error fetching activity:", error)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}
