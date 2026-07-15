import { beforeEach, describe, expect, it, vi } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  settings: { findUnique: vi.fn() },
  doctor: { findUnique: vi.fn() },
  appointment: { findFirst: vi.fn(), create: vi.fn() },
}))

const sendAppointmentNotification = vi.hoisted(() => vi.fn())
const emitAppEvent = vi.hoisted(() => vi.fn())
const logActivity = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/notifications", () => ({ sendAppointmentNotification }))
vi.mock("@/lib/event-bus", () => ({ emitAppEvent }))
vi.mock("@/lib/activity", () => ({ logActivity }))
vi.mock("@/lib/appointment-utils", () => ({ applyExpiredStatuses: vi.fn((value) => value) }))
vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "user-1", role: "SUPER_ADMIN", name: "Test Admin", email: "admin@test.com" },
  }),
}))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

import { POST } from "@/app/api/appointments/route"

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const SETTINGS = {
  id: "clinic_settings",
  workingDays: "0,1,2,3,4,5,6",
  workdayStart: "08:00",
  workdayEnd: "18:00",
}

const BODY = {
  date: "2026-08-20T00:00:00.000Z",
  startTime: "10:00",
  endTime: "10:30",
  duration: 30,
  status: "IN_ASTEPTARE",
  type: "CONSULTATIE",
  notes: null,
  patientId: "pat-1",
  doctorId: "doc-1",
  departmentId: "dep-1",
  serviceId: "srv-1",
  sendEmail: true,
  sendSMS: true,
}

describe("POST /api/appointments", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.settings.findUnique.mockResolvedValue(SETTINGS)
    mockPrisma.doctor.findUnique.mockResolvedValue({ status: "ACTIV", name: "Dr. Test" })
    mockPrisma.appointment.findFirst.mockResolvedValue(null)
    mockPrisma.appointment.create.mockResolvedValue({
      id: "apt-1",
      date: new Date(BODY.date),
      startTime: BODY.startTime,
      patient: { name: "Ion Popescu", email: "ion@example.com", phone: "0712345678" },
      doctor: { name: "Dr. Test" },
      department: { name: "Cardiologie" },
    })
  })

  it("does not write unsupported schema fields on appointment creation", async () => {
    const res = await POST(makeRequest(BODY))

    expect(res.status).toBe(201)
    expect(mockPrisma.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          patientId: "pat-1",
        }),
      })
    )
    expect(mockPrisma.appointment.create.mock.calls[0][0].data).not.toHaveProperty("smsReminderOptIn")
  })

  it("sends the booking notification through SMS when opted in", async () => {
    await POST(makeRequest(BODY))

    expect(sendAppointmentNotification).toHaveBeenCalledWith(
      expect.any(Object),
      "BOOKING_RECEIVED",
      expect.objectContaining({
        sendEmail: true,
        sendSMS: true,
      })
    )
  })
})
