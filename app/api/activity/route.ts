import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())

    const feedWhere: Record<string, unknown> = {}
    if (action) feedWhere.action = action
    if (from || to) {
      feedWhere.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
      }
    }

    const [activities, todayCount, weekCount, activeUsersRaw] = await Promise.all([
      prisma.activityLog.findMany({
        where: feedWhere,
        include: {
          user: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
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
