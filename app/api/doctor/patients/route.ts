import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "DOCTOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const doctorId = session.user.doctorId
  if (!doctorId) return NextResponse.json({ message: "Profilul de medic nu a fost găsit" }, { status: 404 })

  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { primaryDoctorId: doctorId },
        { appointments: { some: { doctorId } } },
      ],
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      status: true,
      birthDate: true,
      gender: true,
      _count: { select: { appointments: true, medicalRecords: true } },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(patients)
}
