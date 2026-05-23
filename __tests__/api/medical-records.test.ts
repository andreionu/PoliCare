import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Hoisted mocks (must be before vi.mock calls) ────────────────────────────
const mockPrisma = vi.hoisted(() => ({
  medicalRecord: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  patient: {
    findFirst: vi.fn(),
  },
}))

const mockGetServerSession = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

import { GET, POST } from "@/app/api/medical-records/route"

function makeGET(params?: Record<string, string>): Request {
  const url = new URL("http://localhost/api/medical-records")
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  }
  return new Request(url.toString())
}

function makePOST(body: unknown): Request {
  return new Request("http://localhost/api/medical-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const SAMPLE_RECORD = {
  id: "rec1",
  patientId: "pat1",
  visitDate: new Date("2026-05-01"),
  symptoms: "Febra, tuse",
  diagnosis: "Gripa",
  treatment: "Repaus",
  prescription: "Paracetamol",
  notes: null,
  followUpRequired: false,
  followUpDate: null,
  appointmentId: "appt1",
  appointment: { id: "appt1", date: new Date("2026-05-01"), startTime: "10:00", doctor: { id: "doc1", name: "Dr. Pop" } },
}

describe("GET /api/medical-records", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns all records when no patientId filter", async () => {
    mockPrisma.medicalRecord.findMany.mockResolvedValue([SAMPLE_RECORD])
    const res = await GET(makeGET())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe("rec1")
    expect(mockPrisma.medicalRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    )
  })

  it("filters by patientId when provided", async () => {
    mockPrisma.medicalRecord.findMany.mockResolvedValue([SAMPLE_RECORD])
    const res = await GET(makeGET({ patientId: "pat1" }))
    expect(res.status).toBe(200)
    expect(mockPrisma.medicalRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { patientId: "pat1" } })
    )
  })

  it("returns 500 on DB error", async () => {
    mockPrisma.medicalRecord.findMany.mockRejectedValue(new Error("DB down"))
    const res = await GET(makeGET())
    expect(res.status).toBe(500)
  })
})

describe("POST /api/medical-records", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makePOST({ patientId: "pat1" }))
    expect(res.status).toBe(401)
  })

  it("returns 400 when patientId is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "FRONT_DESK" } })
    const res = await POST(makePOST({}))
    expect(res.status).toBe(400)
  })

  it("creates record successfully as FRONT_DESK", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "FRONT_DESK" } })
    mockPrisma.medicalRecord.create.mockResolvedValue(SAMPLE_RECORD)

    const res = await POST(makePOST({
      patientId: "pat1",
      appointmentId: "appt1",
      visitDate: "2026-05-01",
      symptoms: "Febra, tuse",
      diagnosis: "Gripa",
      followUpRequired: false,
    }))

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe("rec1")
    expect(data.diagnosis).toBe("Gripa")
  })

  it("returns 403 when DOCTOR tries to add record for non-own patient", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "DOCTOR", doctorId: "doc1" } })
    mockPrisma.patient.findFirst.mockResolvedValue(null)

    const res = await POST(makePOST({ patientId: "pat-other" }))
    expect(res.status).toBe(403)
  })

  it("creates record as DOCTOR for own patient with follow-up", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "DOCTOR", doctorId: "doc1" } })
    mockPrisma.patient.findFirst.mockResolvedValue({ id: "pat1" })
    mockPrisma.medicalRecord.create.mockResolvedValue(SAMPLE_RECORD)

    const res = await POST(makePOST({
      patientId: "pat1",
      appointmentId: "appt1",
      diagnosis: "Gripa",
      followUpRequired: true,
      followUpDate: "2026-06-01",
    }))

    expect(res.status).toBe(201)
    expect(mockPrisma.medicalRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          followUpRequired: true,
          patientId: "pat1",
        }),
      })
    )
  })

  it("sets followUpDate to null when followUpRequired is false", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "FRONT_DESK" } })
    mockPrisma.medicalRecord.create.mockResolvedValue(SAMPLE_RECORD)

    await POST(makePOST({
      patientId: "pat1",
      followUpRequired: false,
      followUpDate: null,
    }))

    expect(mockPrisma.medicalRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ followUpDate: null }),
      })
    )
  })
})
