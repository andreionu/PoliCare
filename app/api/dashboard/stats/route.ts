import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()

    // Today boundaries
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    // This month boundaries
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Last month boundaries
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = startOfThisMonth

    const [
      totalPatients,
      newPatientsThisMonth,
      newPatientsLastMonth,
      appointmentsToday,
      activeDoctors,
      finishedThisMonth,
      noShowThisMonth,
      finishedLastMonth,
      noShowLastMonth,
      recentAppointments,
      departmentsRaw,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.patient.count({ where: { createdAt: { gte: startOfThisMonth, lt: startOfNextMonth } } }),
      prisma.patient.count({ where: { createdAt: { gte: startOfLastMonth, lt: endOfLastMonth } } }),
      prisma.appointment.count({ where: { date: { gte: startOfToday, lt: endOfToday } } }),
      prisma.doctor.count({ where: { status: "ACTIV" } }),
      prisma.appointment.count({ where: { date: { gte: startOfThisMonth, lt: startOfNextMonth }, status: "FINALIZAT" } }),
      prisma.appointment.count({ where: { date: { gte: startOfThisMonth, lt: startOfNextMonth }, status: "NEPREZENTARE" } }),
      prisma.appointment.count({ where: { date: { gte: startOfLastMonth, lt: endOfLastMonth }, status: "FINALIZAT" } }),
      prisma.appointment.count({ where: { date: { gte: startOfLastMonth, lt: endOfLastMonth }, status: "NEPREZENTARE" } }),
      prisma.appointment.findMany({
        where: { date: { gte: startOfToday, lt: endOfToday } },
        include: {
          patient: { select: { id: true, name: true } },
          doctor: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { startTime: "asc" },
        take: 8,
      }),
      prisma.department.findMany({
        where: { status: "ACTIV" },
        include: {
          _count: { select: { doctors: true, appointments: true } },
        },
        orderBy: { name: "asc" },
      }),
    ])

    // Attendance rate: FINALIZAT / (FINALIZAT + NEPREZENTARE)
    const attendanceDenomThisMonth = finishedThisMonth + noShowThisMonth
    const attendanceRate = attendanceDenomThisMonth > 0
      ? Math.round((finishedThisMonth / attendanceDenomThisMonth) * 100)
      : null

    const attendanceDenomLastMonth = finishedLastMonth + noShowLastMonth
    const attendanceRateLastMonth = attendanceDenomLastMonth > 0
      ? Math.round((finishedLastMonth / attendanceDenomLastMonth) * 100)
      : null

    // Today's appointment count per department
    const todayApptsByDept = await prisma.appointment.groupBy({
      by: ["departmentId"],
      where: { date: { gte: startOfToday, lt: endOfToday } },
      _count: { id: true },
    })
    const deptCountMap = Object.fromEntries(todayApptsByDept.map((d) => [d.departmentId, d._count.id]))

    const departments = departmentsRaw.map((d) => ({
      id: d.id,
      name: d.name,
      appointmentsToday: deptCountMap[d.id] ?? 0,
      totalAppointments: d._count.appointments,
      doctorCount: d._count.doctors,
    }))

    return NextResponse.json({
      totalPatients,
      newPatientsThisMonth,
      newPatientsLastMonth,
      appointmentsToday,
      activeDoctors,
      attendanceRate,
      attendanceRateLastMonth,
      recentAppointments,
      departments,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
