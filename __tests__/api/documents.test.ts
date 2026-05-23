import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const mockPrisma = vi.hoisted(() => ({
  document: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  patient: {
    findUnique: vi.fn(),
  },
}))

const mockGetServerSession = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

vi.mock("@azure/storage-blob", () => ({
  BlobServiceClient: {
    fromConnectionString: vi.fn().mockReturnValue({
      getContainerClient: vi.fn().mockReturnValue({
        createIfNotExists: vi.fn().mockResolvedValue(true),
        getBlockBlobClient: vi.fn().mockReturnValue({
          uploadData: vi.fn().mockResolvedValue(true),
          url: "http://mockazure.com/test.pdf",
        }),
      }),
    }),
  },
}))

import { GET } from "@/app/api/patients/[id]/documents/route"
import { POST } from "@/app/api/documents/route"

const SAMPLE_DOCS = [
  { id: "1", name: "test.pdf", url: "http://test/test.pdf", type: "application/pdf", size: 1024, patientId: "p1" },
]

describe("GET /api/patients/[id]/documents", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null)
    const req = new Request("http://localhost/api/patients/p1/documents")
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) })
    expect(res.status).toBe(401)
  })

  it("returns documents for a patient when authenticated as FRONT_DESK", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "FRONT_DESK", id: "u1" } })
    mockPrisma.document.findMany.mockResolvedValue(SAMPLE_DOCS)

    const req = new Request("http://localhost/api/patients/p1/documents")
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe("test.pdf")
    expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
      where: { patientId: "p1" },
      orderBy: { createdAt: "desc" },
    })
  })

  it("returns 400 when patient ID is empty", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "FRONT_DESK", id: "u1" } })
    const req = new Request("http://localhost/api/patients//documents")
    const res = await GET(req, { params: Promise.resolve({ id: "" }) })
    expect(res.status).toBe(400)
  })

  it("returns 403 when PATIENT tries to view another patient's documents", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "PATIENT", id: "u2" } })
    mockPrisma.patient.findUnique.mockResolvedValue({ userId: "u1" })

    const req = new Request("http://localhost/api/patients/p1/documents")
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) })
    expect(res.status).toBe(403)
  })

  it("returns documents when PATIENT views their own", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "PATIENT", id: "u1" } })
    mockPrisma.patient.findUnique.mockResolvedValue({ userId: "u1" })
    mockPrisma.document.findMany.mockResolvedValue(SAMPLE_DOCS)

    const req = new Request("http://localhost/api/patients/p1/documents")
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) })
    expect(res.status).toBe(200)
  })
})

describe("POST /api/documents", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null)
    const req = new Request("http://localhost/api/documents", { method: "POST", body: new FormData() })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("returns 403 for DOCTOR role", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "DOCTOR" } })
    const req = new Request("http://localhost/api/documents", { method: "POST", body: new FormData() })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it("returns 400 when file or patientId is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "FRONT_DESK" } })
    const req = new Request("http://localhost/api/documents", { method: "POST", body: new FormData() })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 for invalid file type", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "FRONT_DESK" } })
    const formData = new FormData()
    formData.append("file", new File(["content"], "test.txt", { type: "text/plain" }))
    formData.append("patientId", "p1")
    const req = new Request("http://localhost/api/documents", { method: "POST", body: formData })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.message).toContain("Invalid file type")
  })
})
