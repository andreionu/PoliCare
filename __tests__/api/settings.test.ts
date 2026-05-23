import { describe, it, expect, vi, beforeEach } from "vitest"

const DEFAULT = {
  id: "clinic_settings",
  clinicName: "Policare",
  clinicPhone: "",
  clinicEmail: "",
  clinicAddress: "",
  emailNotifications: true,
  smsNotifications: false,
  defaultAppointmentDuration: 30,
  workdayStart: "08:00",
  workdayEnd: "18:00",
  reminderEnabled: true,
  reminderHoursBefore: 24,
  updatedAt: new Date(),
}

const mockPrisma = vi.hoisted(() => ({
  settings: {
    upsert: vi.fn(),
  },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import { GET, PUT } from "@/app/api/settings/route"

function makeRequest(method: string, body?: unknown): Request {
  return new Request("http://localhost/api/settings", {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("GET /api/settings", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns settings from database", async () => {
    mockPrisma.settings.upsert.mockResolvedValue(DEFAULT)

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.clinicName).toBe("Policare")
    expect(data.workdayStart).toBe("08:00")
  })

  it("calls upsert with empty update to trigger create-or-return", async () => {
    mockPrisma.settings.upsert.mockResolvedValue(DEFAULT)

    await GET()

    expect(mockPrisma.settings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "clinic_settings" },
        update: {},
      })
    )
  })

  it("returns 500 on database error", async () => {
    mockPrisma.settings.upsert.mockRejectedValue(new Error("DB error"))

    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe("PUT /api/settings", () => {
  beforeEach(() => vi.clearAllMocks())

  it("updates only provided fields", async () => {
    const updated = { ...DEFAULT, clinicName: "New Clinic" }
    mockPrisma.settings.upsert.mockResolvedValue(updated)

    const res = await PUT(makeRequest("PUT", { clinicName: "New Clinic" }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.clinicName).toBe("New Clinic")

    const call = mockPrisma.settings.upsert.mock.calls[0][0]
    expect(call.update).toHaveProperty("clinicName", "New Clinic")
    expect(call.update).not.toHaveProperty("clinicPhone") // not in request
  })

  it("updates boolean notification fields", async () => {
    mockPrisma.settings.upsert.mockResolvedValue({ ...DEFAULT, emailNotifications: false })

    await PUT(makeRequest("PUT", { emailNotifications: false }))

    const call = mockPrisma.settings.upsert.mock.calls[0][0]
    expect(call.update.emailNotifications).toBe(false)
  })

  it("updates working hours", async () => {
    mockPrisma.settings.upsert.mockResolvedValue({ ...DEFAULT, workdayStart: "07:00", workdayEnd: "20:00" })

    await PUT(makeRequest("PUT", { workdayStart: "07:00", workdayEnd: "20:00" }))

    const call = mockPrisma.settings.upsert.mock.calls[0][0]
    expect(call.update.workdayStart).toBe("07:00")
    expect(call.update.workdayEnd).toBe("20:00")
  })

  it("skips undefined fields (does not pass them to Prisma)", async () => {
    mockPrisma.settings.upsert.mockResolvedValue(DEFAULT)

    // Only send clinicName, leave everything else out
    await PUT(makeRequest("PUT", { clinicName: "Test" }))

    const call = mockPrisma.settings.upsert.mock.calls[0][0]
    expect(Object.keys(call.update)).toEqual(["clinicName"])
  })

  it("updates reminderEnabled field", async () => {
    mockPrisma.settings.upsert.mockResolvedValue({ ...DEFAULT, reminderEnabled: false })

    await PUT(makeRequest("PUT", { reminderEnabled: false }))

    const call = mockPrisma.settings.upsert.mock.calls[0][0]
    expect(call.update.reminderEnabled).toBe(false)
  })

  it("updates reminderHoursBefore field", async () => {
    mockPrisma.settings.upsert.mockResolvedValue({ ...DEFAULT, reminderHoursBefore: 48 })

    await PUT(makeRequest("PUT", { reminderHoursBefore: 48 }))

    const call = mockPrisma.settings.upsert.mock.calls[0][0]
    expect(call.update.reminderHoursBefore).toBe(48)
  })

  it("returns 500 on database error", async () => {
    mockPrisma.settings.upsert.mockRejectedValue(new Error("DB error"))

    const res = await PUT(makeRequest("PUT", { clinicName: "Test" }))
    expect(res.status).toBe(500)
  })
})
