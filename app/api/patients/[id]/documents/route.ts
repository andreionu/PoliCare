import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  try {
    const { id: patientId } = await params

    // PATIENT can only view their own documents
    if (session.user.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { userId: true } })
      if (!patient || patient.userId !== session.user.id) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 })
      }
    }
    
    if (!patientId) {
      return NextResponse.json({ message: "Patient ID is required" }, { status: 400 })
    }

    const documents = await prisma.document.findMany({
      where: { patientId: patientId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
