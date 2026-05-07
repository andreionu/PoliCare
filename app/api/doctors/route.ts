import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/doctors - Get all doctors (supports ?search=X and ?departmentId=X filters)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const departmentId = searchParams.get("departmentId")
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { specialty: { contains: search, mode: "insensitive" } },
      ]
    }
    if (departmentId) where.departmentId = departmentId

    const pageParam = searchParams.get("page")
    const paginated = pageParam !== null
    const page = Math.max(1, parseInt(pageParam ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))

    const query = {
      where,
      include: {
        department: { select: { id: true, name: true, color: true } },
        _count: {
          select: {
            appointments: true,
            patients: true,
          },
        },
      },
      orderBy: { name: "asc" } as const,
    }

    if (!paginated) {
      const doctors = await prisma.doctor.findMany(query)
      return NextResponse.json(doctors)
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({ ...query, skip: (page - 1) * limit, take: limit }),
      prisma.doctor.count({ where }),
    ])

    return NextResponse.json({ data: doctors, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("Error fetching doctors:", error)
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    )
  }
}

// POST /api/doctors - Create a new doctor
export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name?.trim() || !body.specialty?.trim()) {
      return NextResponse.json({ error: "Name and specialty are required" }, { status: 400 })
    }

    const doctor = await prisma.doctor.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        gender: body.gender || null,
        specialty: body.specialty,
        experience: body.experience,
        bio: body.bio,
        avatar: body.avatar,
        status: body.status || "ACTIV",
        departmentId: body.departmentId,
      },
      include: {
        department: { select: { id: true, name: true, color: true } },
      },
    })

    return NextResponse.json(doctor, { status: 201 })
  } catch (error) {
    console.error("Error creating doctor:", error)
    return NextResponse.json(
      { error: "Failed to create doctor" },
      { status: 500 }
    )
  }
}
