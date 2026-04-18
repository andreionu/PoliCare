import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/patients/merge - Merge source patient into target patient
export async function POST(request: Request) {
  try {
    const { sourcePatientId, targetPatientId } = await request.json()

    if (!sourcePatientId || !targetPatientId || sourcePatientId === targetPatientId) {
      return NextResponse.json(
        { error: "Invalid patient IDs provided for merge." },
        { status: 400 }
      )
    }

    // Verify both exist
    const source = await prisma.patient.findUnique({ where: { id: sourcePatientId } })
    const target = await prisma.patient.findUnique({ where: { id: targetPatientId } })

    if (!source || !target) {
      return NextResponse.json(
        { error: "One or both patients not found." },
        { status: 404 }
      )
    }

    // Perform transaction
    await prisma.$transaction(async (tx) => {
      // 1. Move Appointments
      await tx.appointment.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId }
      })

      // 2. Move Medical Records
      await tx.medicalRecord.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId }
      })

      // 3. Combine Notes
      if (source.notes) {
        const combinedNotes = target.notes 
          ? `${target.notes}\n\n--- Note Vechi (din profil contopit) ---\n${source.notes}`
          : `--- Note Vechi (din profil contopit) ---\n${source.notes}`;
        
        await tx.patient.update({
          where: { id: targetPatientId },
          data: { notes: combinedNotes }
        })
      }

      // 4. Delete Source Patient
      await tx.patient.delete({
        where: { id: sourcePatientId }
      })

      // 5. Log Activity
      await tx.activityLog.create({
        data: {
          action: "MERGE",
          entity: "Patient",
          entityId: targetPatientId,
          description: `A contopit datele pacientului ${source.name} în acest profil.`
        }
      })
    })

    return NextResponse.json({ message: "Patients merged successfully." })
  } catch (error) {
    console.error("Error merging patients:", error)
    return NextResponse.json(
      { error: "Failed to merge patients" },
      { status: 500 }
    )
  }
}
