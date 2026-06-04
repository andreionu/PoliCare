import { NextResponse } from "next/server"
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || ""
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "documents"
const ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME || ""
const ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY || ""

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { patient: { select: { userId: true, primaryDoctorId: true } } },
  })
  if (!doc) return NextResponse.json({ message: "Document negăsit" }, { status: 404 })

  // Role-based access
  if (session.user.role === "PATIENT") {
    if (doc.patient.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }
  } else if (session.user.role === "DOCTOR") {
    const doctorId = session.user.doctorId
    const hasRelation =
      doc.patient.primaryDoctorId === doctorId ||
      (await prisma.appointment.count({ where: { patientId: doc.patientId, doctorId: doctorId ?? "" } })) > 0
    if (!hasRelation) return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }
  // SUPER_ADMIN and FRONT_DESK: no restriction

  // If it's a mock URL, return it directly
  if (!doc.url || doc.url.includes("mockstorage")) {
    return NextResponse.json({ url: doc.url, expiresAt: null, mock: true })
  }

  // Generate SAS URL if account credentials are available
  if (ACCOUNT_NAME && ACCOUNT_KEY) {
    try {
      const sharedKeyCredential = new StorageSharedKeyCredential(ACCOUNT_NAME, ACCOUNT_KEY)
      const urlObj = new URL(doc.url)
      const blobName = urlObj.pathname.replace(`/${containerName}/`, "").replace(/^\//, "")

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

      const sasToken = generateBlobSASQueryParameters(
        {
          containerName,
          blobName,
          permissions: BlobSASPermissions.parse("r"),
          expiresOn: expiresAt,
        },
        sharedKeyCredential
      ).toString()

      const sasUrl = `${doc.url}?${sasToken}`
      return NextResponse.json({ url: sasUrl, expiresAt: expiresAt.toISOString() })
    } catch (err) {
      console.error("[documents/url] SAS generation error:", err)
    }
  }

  // Fallback: return the raw URL (works if blob is publicly accessible)
  return NextResponse.json({ url: doc.url, expiresAt: null })
}
