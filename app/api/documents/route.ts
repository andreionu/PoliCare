import { NextResponse } from "next/server"
import { BlobServiceClient } from "@azure/storage-blob"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || ""
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "documents"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  if (!["SUPER_ADMIN", "FRONT_DESK", "DOCTOR"].includes(session.user.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const patientId = formData.get("patientId") as string | null

    if (!file || !patientId) {
      return NextResponse.json({ message: "File and patientId are required" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: "Invalid file type. Only PDF, JPG, and PNG are allowed." }, { status: 400 })
    }

    // Validate file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ message: "File size exceeds 10MB limit." }, { status: 400 })
    }

    let url = ""

    // Upload to Azure Blob Storage if connection string is configured
    if (AZURE_STORAGE_CONNECTION_STRING) {
      const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
      const containerClient = blobServiceClient.getContainerClient(containerName)
      
      // Create container if it doesn't exist
      await containerClient.createIfNotExists({ access: 'blob' })

      const extension = file.name.split('.').pop()
      const blobName = `${patientId}/${uuidv4()}.${extension}`
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: file.type }
      })

      url = blockBlobClient.url
    } else {
      // Mock mode for local dev if no connection string
      console.warn("AZURE_STORAGE_CONNECTION_STRING not set, running in mock mode.")
      url = `https://mockstorage.blob.core.windows.net/documents/${uuidv4()}-${file.name}`
    }

    const document = await prisma.document.create({
      data: {
        name: file.name,
        url: url,
        type: file.type,
        size: file.size,
        patientId: patientId,
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Upload Error:", error)
    return NextResponse.json({ message: "Internal server error during file upload" }, { status: 500 })
  }
}
