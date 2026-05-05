import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date()
  switch (period) {
    case "last-month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start, end }
    }
    case "last-3-months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      return { start, end: now }
    }
    case "last-6-months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      return { start, end: now }
    }
    case "this-year": {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start, end: now }
    }
    default: { // current-month
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      return { start, end }
    }
  }
}

function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return ""
  const str = String(val)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(escapeCsv).join(",")
}

// GET /api/reports?type=patients&period=current-month&format=csv
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "patients"
  const period = searchParams.get("period") || "current-month"
  const format = searchParams.get("format") || "csv"

  if (format !== "csv" && format !== "excel" && format !== "json") {
    return NextResponse.json({ error: "FORMAT_UNSUPPORTED", message: "Format nesuportat." }, { status: 422 })
  }

  const { start, end } = getDateRange(period)
  const dateStr = new Date().toISOString().split("T")[0]

  try {
    let csvContent = ""
    let filename = `raport-${type}-${dateStr}.csv`
    let header = ""
    let rows: string[] = []

    if (type === "patients") {
      const patients = await prisma.patient.findMany({
        where: { createdAt: { gte: start, lt: end } },
        include: { primaryDoctor: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      })
      header = toCsvRow(["Nume", "CNP", "Vârstă", "Gen", "Telefon", "Email", "Status", "Medic primar", "Data înregistrare"])
      rows = patients.map((p) => toCsvRow([
        p.name, p.cnp, p.age, p.gender, p.phone, p.email, p.status,
        p.primaryDoctor?.name, new Date(p.createdAt).toLocaleDateString("ro-RO"),
      ]))
      csvContent = [header, ...rows].join("\r\n")
    } else if (type === "appointments") {
      const appointments = await prisma.appointment.findMany({
        where: { date: { gte: start, lt: end } },
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true } },
          department: { select: { name: true } },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      })
      header = toCsvRow(["ID", "Data", "Ora", "Pacient", "Medic", "Departament", "Status", "Durată (min)"])
      rows = appointments.map((a) => toCsvRow([
        a.id,
        new Date(a.date).toLocaleDateString("ro-RO"),
        a.startTime,
        a.patient.name,
        a.doctor.name,
        a.department?.name,
        a.status,
        a.duration,
      ]))
      csvContent = [header, ...rows].join("\r\n")
    } else if (type === "doctors") {
      const doctors = await prisma.doctor.findMany({
        include: {
          department: { select: { name: true } },
          _count: { select: { appointments: true, patients: true } },
        },
        orderBy: { name: "asc" },
      })
      header = toCsvRow(["Nume", "Specialitate", "Departament", "Experiență", "Rating", "Nr. programări", "Nr. pacienți"])
      rows = doctors.map((d) => toCsvRow([
        d.name, d.specialty, d.department.name, d.experience, d.rating,
        d._count.appointments, d._count.patients,
      ]))
      csvContent = [header, ...rows].join("\r\n")
    } else if (type === "departments") {
      const departments = await prisma.department.findMany({
        include: {
          _count: { select: { doctors: true, appointments: true } },
        },
        orderBy: { name: "asc" },
      })
      header = toCsvRow(["Departament", "Status", "Nr. medici", "Nr. programări"])
      rows = departments.map((d) => toCsvRow([
        d.name, d.status, d._count.doctors, d._count.appointments,
      ]))
      csvContent = [header, ...rows].join("\r\n")
    } else {
      return NextResponse.json({ error: "Unknown report type" }, { status: 400 })
    }

    if (format === "json") {
      return NextResponse.json({ headers: header.split(","), rows: rows.map(r => r.split(",")) })
    }

    // BOM for Excel UTF-8 compatibility
    const bom = "\uFEFF"
    return new Response(bom + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
