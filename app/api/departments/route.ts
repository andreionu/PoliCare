import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/departments - Get all departments
export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            doctors: true,
            appointments: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(departments)
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    )
  }
}

// POST /api/departments - Create a new department
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["SUPER_ADMIN", "FRONT_DESK"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Department name is required" }, { status: 400 })
    }

    const department = await prisma.department.create({
      data: {
        name: body.name,
        description: body.description,
        color: body.color,
        icon: body.icon,
        status: body.status || "ACTIV",
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    console.error("Error creating department:", error)
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    )
  }
}
