import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json({ message: "Patient ID is required" }, { status: 400 })
    }

    const documents = await prisma.document.findMany({
      where: { patientId: id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
