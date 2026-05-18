import { NextResponse } from "next/server"
import { BlobServiceClient } from "@azure/storage-blob"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || ""
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "documents"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  if (!["SUPER_ADMIN", "FRONT_DESK"].includes(session.user.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ message: "Document negăsit" }, { status: 404 })

  // Delete from Azure if connection string is available
  if (AZURE_STORAGE_CONNECTION_STRING && doc.url && !doc.url.includes("mockstorage")) {
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
      const containerClient = blobServiceClient.getContainerClient(containerName)
      // Extract blob name from URL
      const urlObj = new URL(doc.url)
      const blobName = urlObj.pathname.replace(`/${containerName}/`, "")
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)
      await blockBlobClient.deleteIfExists()
    } catch (err) {
      console.error("[documents] Azure delete error:", err)
    }
  }

  await prisma.document.delete({ where: { id } })

  return NextResponse.json({ message: "Document șters" })
}
