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
    const monthlyTrend = []
    
    for (let i = 0; i < 6; i++) {
      const monthOffset = 5 - i // 5 months ago to current
      const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1)
      
      const [patients, appointments, finished, total] = await Promise.all([
        prisma.patient.count({ where: { createdAt: { gte: monthDate, lt: nextMonthDate } } }),
        prisma.appointment.count({ where: { date: { gte: monthDate, lt: nextMonthDate } } }),
        prisma.appointment.count({ where: { date: { gte: monthDate, lt: nextMonthDate }, status: "FINALIZAT" } }),
        prisma.appointment.count({ where: { date: { gte: monthDate, lt: nextMonthDate }, status: { notIn: ["ANULAT", "NEPREZENTARE"] } } }),
      ])
      
      monthlyTrend.push({
        month: MONTH_NAMES_RO[monthDate.getMonth()],
        patients,
        appointments,
        completionRate: total > 0 ? Math.round((finished / total) * 100) : 0,
        appointmentsPerPatient: patients > 0 ? (appointments / patients).toFixed(1) : "0",
      })
    }

    // Advanced Analytics
    
    // 1. Service Popularity (Group by Appointment Type)
    const appointmentsByType = await prisma.appointment.groupBy({
      by: ['type'],
      _count: { id: true },
      where: {
        date: { gte: new Date(now.getFullYear(), now.getMonth() - 2, 1) } // Last 3 months for relevance
      },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });
    
    const servicePopularity = appointmentsByType.map(item => ({
      name: item.type || "General",
      value: item._count.id
    }));

    // 2. Peak Hours
    const allAppointments = await prisma.appointment.findMany({
      where: {
        date: { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1) }, // Last 2 months
        status: { notIn: ["ANULAT", "NEPREZENTARE"] }
      },
      select: { startTime: true }
    });

    const hourCounts: Record<string, number> = {};
    allAppointments.forEach(app => {
      const hour = app.startTime.split(':')[0];
      if (hour) {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const peakHours = Object.keys(hourCounts).sort().map(hour => ({
      hour: `${hour}:00`,
      count: hourCounts[hour]
    }));

    // 3. Demographics
    const demographicsData = await prisma.patient.groupBy({
      by: ['gender'],
      _count: { id: true }
    });
    
    const demographics = demographicsData.map(item => {
      const g = item.gender ? String(item.gender).toUpperCase() : "";
      return {
        name: g === "MASCULIN" ? "Masculin" : g === "FEMININ" ? "Feminin" : "Altul/Nespecificat",
        value: item._count.id
      };
    });

    return NextResponse.json({
      patientsThisMonth,
      appointmentsThisMonth,
      completionRate,
      monthlyTrend,
      servicePopularity,
      peakHours,
      demographics
    })
  } catch (error) {
    console.error("Error fetching report stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
