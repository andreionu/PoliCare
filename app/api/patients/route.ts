import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/patients - Get all patients (supports ?phone=X, ?email=X and ?search=X filters)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")
    const email = searchParams.get("email")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}
    
    // Support OR matching for smart booking
    if (phone && email) {
      where.OR = [
        { phone: phone },
        { email: email }
      ]
    } else if (phone) {
      where.phone = phone
    } else if (email) {
      where.email = email
    }

    if (search) {
      if (where.OR) {
        // If we already have an OR, we need to AND it with the search
        where.AND = [
           { OR: where.OR },
           { name: { contains: search, mode: "insensitive" } }
        ]
        delete where.OR
      } else {
        where.name = { contains: search, mode: "insensitive" }
      }
    }

    const pageParam = searchParams.get("page")
    const paginated = pageParam !== null
    const page = Math.max(1, parseInt(pageParam ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))

    const query = {
      where,
      include: {
        primaryDoctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            medicalRecords: true,
          },
        },
      },
      orderBy: { createdAt: "desc" } as const,
    }

    if (!paginated) {
      const patients = await prisma.patient.findMany(query)
      return NextResponse.json(patients)
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({ ...query, skip: (page - 1) * limit, take: limit }),
      prisma.patient.count({ where }),
    ])

    return NextResponse.json({ data: patients, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    )
  }
}

// POST /api/patients - Create a new patient
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json()

    const patient = await prisma.patient.create({
      data: {
        name: body.name,
        cnp: body.cnp || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        age: body.age,
        gender: body.gender || null,
        phone: body.phone,
        email: body.email,
        address: body.address,
        status: body.status || "NOU",
        notes: body.notes,
        primaryDoctorId: body.primaryDoctorId,
      },
      include: {
        primaryDoctor: { select: { id: true, name: true, specialty: true } },
      },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error: any) {
    // Handle expected CNP uniqueness conflict (P2002)
    if (error.code === 'P2002' || (error.message && error.message.includes('unique constraint'))) {
       try {
         if (body && body.cnp) {
           const existing = await prisma.patient.findUnique({ where: { cnp: body.cnp } });
           if (existing) {
             return NextResponse.json(
               { error: "Un alt pacient este deja înregistrat cu acest CNP.", existingPatientId: existing.id },
               { status: 409 }
             )
           }
         }
         // If we don't have body or can't find the existing one, still return a 409 if we're sure it's a conflict
         return NextResponse.json(
           { error: "Un pacient cu acest CNP există deja în sistem.", isConflict: true },
           { status: 409 }
         )
       } catch (e) {
          console.error("Critical error during conflict resolution:", e)
       }
    }
    
    // Only log actual unexpected errors
    console.error("Unexpected error creating patient:", error)
    
    return NextResponse.json(
      { 
        error: "Eroare la crearea pacientului: " + (error.message || 'Eroare necunoscută'), 
        code: error.code 
      },
      { status: 500 }
    )
  }
}
