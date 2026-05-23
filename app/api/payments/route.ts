import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { emitAppEvent } from "@/lib/event-bus"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["SUPER_ADMIN", "FRONT_DESK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") // UNPAID | PENDING | PAID | REFUNDED | all
  const period = searchParams.get("period") // current-month | last-month | last-3-months | this-year

  const now = new Date()
  let dateFilter: { gte?: Date; lt?: Date } = {}
  if (period === "current-month") {
    dateFilter = { gte: new Date(now.getFullYear(), now.getMonth(), 1), lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) }
  } else if (period === "last-month") {
    dateFilter = { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1), lt: new Date(now.getFullYear(), now.getMonth(), 1) }
  } else if (period === "last-3-months") {
    dateFilter = { gte: new Date(now.getFullYear(), now.getMonth() - 3, 1) }
  } else if (period === "this-year") {
    dateFilter = { gte: new Date(now.getFullYear(), 0, 1) }
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)))

  const where: any = {}
  if (status && status !== "all") where.paymentStatus = status
  if (Object.keys(dateFilter).length) where.date = dateFilter
  // Only show appointments that have a service with a price (otherwise payment is irrelevant)
  where.service = { isNot: null }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        date: true,
        startTime: true,
        paymentStatus: true,
        stripeSessionId: true,
        status: true,
        patient: { select: { id: true, name: true, email: true } },
        doctor: { select: { name: true } },
        service: { select: { name: true, price: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ])

  // Compute stats from all appointments (ignoring status filter for the summary)
  const allForStats = await prisma.appointment.findMany({
    where: {
      service: { isNot: null },
      ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    },
    select: { paymentStatus: true, service: { select: { price: true } } },
  })

  let totalRevenue = 0
  let paidCount = 0
  let pendingCount = 0
  let unpaidCount = 0
  let refundedCount = 0

  for (const a of allForStats) {
    const price = a.service?.price ?? 0
    if (a.paymentStatus === "PAID") { totalRevenue += price; paidCount++ }
    else if (a.paymentStatus === "PENDING") pendingCount++
    else if (a.paymentStatus === "UNPAID") unpaidCount++
    else if (a.paymentStatus === "REFUNDED") refundedCount++
  }

  return NextResponse.json({
    appointments,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
    stats: { totalRevenue, paidCount, pendingCount, unpaidCount, refundedCount },
  })
}

// PATCH /api/payments — admin manually marks an appointment as PAID (cash payment)
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["SUPER_ADMIN", "FRONT_DESK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { appointmentId, paymentStatus } = await request.json()
  if (!appointmentId || !paymentStatus) {
    return NextResponse.json({ error: "appointmentId and paymentStatus required" }, { status: 400 })
  }
  if (!["PAID", "UNPAID", "REFUNDED"].includes(paymentStatus)) {
    return NextResponse.json({ error: "Invalid paymentStatus" }, { status: 400 })
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentStatus, stripeSessionId: paymentStatus === "UNPAID" ? null : undefined },
    select: { id: true, paymentStatus: true },
  })

  emitAppEvent("payment_updated", { appointmentId, paymentStatus })
  return NextResponse.json(updated)
}
