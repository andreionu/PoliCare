import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const MONTH_NAMES_RO = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// GET /api/reports/stats — live dashboard stats + 6-month trend
export async function GET() {
  try {
    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [patientsThisMonth, appointmentsThisMonth, finishedThisMonth, totalThisMonth] = await Promise.all([
      prisma.patient.count({ where: { createdAt: { gte: startOfThisMonth, lt: startOfNextMonth } } }),
      prisma.appointment.count({ where: { date: { gte: startOfThisMonth, lt: startOfNextMonth } } }),
      prisma.appointment.count({ where: { date: { gte: startOfThisMonth, lt: startOfNextMonth }, status: "FINALIZAT" } }),
      prisma.appointment.count({ where: { date: { gte: startOfThisMonth, lt: startOfNextMonth }, status: { notIn: ["ANULAT", "NEPREZENTARE"] } } }),
    ])

    const completionRate = totalThisMonth > 0 ? Math.round((finishedThisMonth / totalThisMonth) * 100) : 0

    // Build 6-month trend (current month + 5 previous)
    const monthlyTrend = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const monthOffset = 5 - i // 5 months ago to current
        const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1)
        return Promise.all([
          prisma.patient.count({ where: { createdAt: { gte: monthDate, lt: nextMonthDate } } }),
          prisma.appointment.count({ where: { date: { gte: monthDate, lt: nextMonthDate } } }),
          prisma.appointment.count({ where: { date: { gte: monthDate, lt: nextMonthDate }, status: "FINALIZAT" } }),
          prisma.appointment.count({ where: { date: { gte: monthDate, lt: nextMonthDate }, status: { notIn: ["ANULAT", "NEPREZENTARE"] } } }),
        ]).then(([patients, appointments, finished, total]) => ({
          month: MONTH_NAMES_RO[monthDate.getMonth()],
          patients,
          appointments,
          completionRate: total > 0 ? Math.round((finished / total) * 100) : 0,
          appointmentsPerPatient: patients > 0 ? (appointments / patients).toFixed(1) : "0",
        }))
      })
    )

    return NextResponse.json({
      patientsThisMonth,
      appointmentsThisMonth,
      completionRate,
      monthlyTrend,
    })
  } catch (error) {
    console.error("Error fetching report stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
