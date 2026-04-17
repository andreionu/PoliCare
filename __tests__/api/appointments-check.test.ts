import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPrisma = {
  doctor: { findUnique: vi.fn() },
  doctorSchedule: { findUnique: vi.fn() },
  appointment: { findFirst: vi.fn() },
}

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import { GET } from "@/app/api/appointments/check/route"

function makeRequest(params: Record<string, string>): Request {
  const url = new URL("http://localhost/api/appointments/check")
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new Request(url.toString())
}

const PARAMS = {
  doctorId: "doc1",
  date: "2026-03-24",
  startTime: "10:00",
  endTime: "10:30",
}

const ACTIVE_DOCTOR = { id: "doc1", name: "Dr. Test", status: "ACTIV" }
const ALL_DAY_SCHEDULE = { isActive: true, startTime: "08:00", endTime: "18:00" }

describe("GET /api/appointments/check", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 400 when required params are missing", async () => {
    const res = await GET(makeRequest({ doctorId: "doc1" }))
    expect(res.status).toBe(400)
  })

  it("returns available=false when doctor is IN_CONCEDIU", async () => {
    mockPrisma.doctor.findUnique.mockResolvedValue({ id: "doc1", name: "Dr. Test", status: "IN_CONCEDIU" })

    const res = await GET(makeRequest(PARAMS))
    const data = await res.json()

    expect(data.available).toBe(false)
    expect(data.reason).toMatch(/concediu/i)
  })

  it("returns available=false when doctor is INDISPONIBIL", async () => {
    mockPrisma.doctor.findUnique.mockResolvedValue({ id: "doc1", name: "Dr. Test", status: "INDISPONIBIL" })

    const res = await GET(makeRequest(PARAMS))
    const data = await res.json()

    expect(data.available).toBe(false)
    expect(data.reason).toMatch(/indisponibil/i)
  })

  it("returns available=false when doctor schedule is inactive for that day", async () => {
    mockPrisma.doctor.findUnique.mockResolvedValue(ACTIVE_DOCTOR)
    mockPrisma.doctorSchedule.findUnique.mockResolvedValue({ isActive: false, startTime: "08:00", endTime: "17:00" })

    const res = await GET(makeRequest(PARAMS))
    const data = await res.json()

    expect(data.available).toBe(false)
    expect(data.reason).toMatch(/nu lucrează/i)
  })

  it("returns available=false when appointment time is outside schedule window", async () => {
    mockPrisma.doctor.findUnique.mockResolvedValue(ACTIVE_DOCTOR)
    // Schedule is 14:00–18:00, but we request 10:00–10:30
    mockPrisma.doctorSchedule.findUnique.mockResolvedValue({ isActive: true, startTime: "14:00", endTime: "18:00" })

    const res = await GET(makeRequest(PARAMS))
    const data = await res.json()

    expect(data.available).toBe(false)
    expect(data.reason).toMatch(/lucrează/i)
  })

  it("returns available=false when overlapping appointment exists", async () => {
    mockPrisma.doctor.findUnique.mockResolvedValue(ACTIVE_DOCTOR)
    mockPrisma.doctorSchedule.findUnique.mockResolvedValue(ALL_DAY_SCHEDULE)
    mockPrisma.appointment.findFirst.mockResolvedValue({
      id: "existing-apt",
      startTime: "09:45",
      endTime: "10:15",
    })

    const res = await GET(makeRequest(PARAMS))
    const data = await res.json()

    expect(data.available).toBe(false)
    expect(data.reason).toMatch(/deja o programare/i)
  })

  it("returns available=true when all checks pass", async () => {
    mockPrisma.doctor.findUnique.mockResolvedValue(ACTIVE_DOCTOR)
    mockPrisma.doctorSchedule.findUnique.mockResolvedValue(ALL_DAY_SCHEDULE)
    mockPrisma.appointment.findFirst.mockResolvedValue(null)

    const res = await GET(makeRequest(PARAMS))
    const data = await res.json()

    expect(data.available).toBe(true)
  })

  it("returns available=true when no schedule configured (schedule not set up yet)", async () => {
    mockPrisma.doctor.findUnique.mockResolvedValue(ACTIVE_DOCTOR)
    mockPrisma.doctorSchedule.findUnique.mockResolvedValue(null) // no schedule
    mockPrisma.appointment.findFirst.mockResolvedValue(null) // no conflict

    const res = await GET(makeRequest(PARAMS))
    const data = await res.json()

    // Implementation allows booking when schedule isn't configured
    expect(data.available).toBe(true)
  })

  it("excludeId skips self in overlap query", async () => {
    mockPrisma.doctor.findUnique.mockResolvedValue(ACTIVE_DOCTOR)
    mockPrisma.doctorSchedule.findUnique.mockResolvedValue(ALL_DAY_SCHEDULE)
    mockPrisma.appointment.findFirst.mockResolvedValue(null)

    await GET(makeRequest({ ...PARAMS, excludeId: "apt-to-edit" }))

    const call = mockPrisma.appointment.findFirst.mock.calls[0][0]
    expect(call.where).toMatchObject({ id: { not: "apt-to-edit" } })
  })
})
