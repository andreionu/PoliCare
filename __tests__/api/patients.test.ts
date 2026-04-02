import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mock Prisma ──────────────────────────────────────────────────────────────
const mockPrisma = {
  patient: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

// Import AFTER mocking
const { GET, POST } = await import("@/app/api/patients/route")

function makeRequest(method: string, body?: unknown, searchParams?: Record<string, string>): Request {
  const url = new URL("http://localhost/api/patients")
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) url.searchParams.set(k, v)
  }
  return new Request(url.toString(), {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("GET /api/patients", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns all patients when no filter", async () => {
    const patients = [
      { id: "p1", name: "Ion Popescu", phone: "0712345678" },
      { id: "p2", name: "Maria Ionescu", phone: "0787654321" },
    ]
    mockPrisma.patient.findMany.mockResolvedValue(patients)

    const res = await GET(makeRequest("GET"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })

  it("filters by phone when ?phone= provided", async () => {
    mockPrisma.patient.findMany.mockResolvedValue([
      { id: "p1", name: "Ion Popescu", phone: "0712345678" },
    ])

    const res = await GET(makeRequest("GET", undefined, { phone: "0712345678" }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { phone: "0712345678" } })
    )
    expect(data[0].phone).toBe("0712345678")
  })

  it("returns 500 on database error", async () => {
    mockPrisma.patient.findMany.mockRejectedValue(new Error("DB error"))

    const res = await GET(makeRequest("GET"))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })
})

describe("POST /api/patients", () => {
  beforeEach(() => vi.clearAllMocks())

  const validBody = {
    name: "Ion Popescu",
    cnp: "1234567890123",
    gender: "MASCULIN",
    phone: "0712345678",
    email: "ion@example.com",
    status: "NOU",
  }

  it("creates a patient and returns 201", async () => {
    const created = { id: "p1", ...validBody }
    mockPrisma.patient.create.mockResolvedValue(created)

    const res = await POST(makeRequest("POST", validBody))

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe("p1")
    expect(data.name).toBe("Ion Popescu")
  })

  it("uses status 'NOU' as default when not provided", async () => {
    const bodyWithoutStatus = { ...validBody }
    delete (bodyWithoutStatus as Partial<typeof validBody>).status
    mockPrisma.patient.create.mockResolvedValue({ id: "p2", ...bodyWithoutStatus, status: "NOU" })

    await POST(makeRequest("POST", bodyWithoutStatus))

    expect(mockPrisma.patient.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "NOU" }),
      })
    )
  })

  it("returns 500 on duplicate cnp (Prisma unique constraint)", async () => {
    const uniqueError = Object.assign(new Error("Unique constraint"), { code: "P2002" })
    mockPrisma.patient.create.mockRejectedValue(uniqueError)

    const res = await POST(makeRequest("POST", validBody))
    expect(res.status).toBe(500)
  })

  it("converts birthDate string to Date object", async () => {
    const bodyWithBirthDate = { ...validBody, birthDate: "1990-05-15" }
    mockPrisma.patient.create.mockResolvedValue({ id: "p3", ...bodyWithBirthDate })

    await POST(makeRequest("POST", bodyWithBirthDate))

    const createCall = mockPrisma.patient.create.mock.calls[0][0]
    expect(createCall.data.birthDate).toBeInstanceOf(Date)
  })

  it("sets birthDate to null when not provided", async () => {
    mockPrisma.patient.create.mockResolvedValue({ id: "p4", ...validBody, birthDate: null })

    await POST(makeRequest("POST", validBody))

    const createCall = mockPrisma.patient.create.mock.calls[0][0]
    expect(createCall.data.birthDate).toBeNull()
  })
})
