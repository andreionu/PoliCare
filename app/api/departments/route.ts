import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/departments - Get all departments
export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        doctors: true, // Include doctors in each department
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
  try {
    const body = await request.json()

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
