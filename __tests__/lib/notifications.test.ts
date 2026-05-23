import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock external sending libs
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock("@/lib/sms", () => ({
  sendSMS: vi.fn().mockResolvedValue({ success: true }),
}))

const mockPrisma = vi.hoisted(() => ({
  settings: { findUnique: vi.fn() },
  notification: { create: vi.fn() },
}))
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import { sendAppointmentNotification } from "@/lib/notifications"
import { sendEmail } from "@/lib/email"
import { sendSMS } from "@/lib/sms"

const mockAppt = {
  id: "a1",
  date: new Date("2026-04-15"),
  startTime: "10:00",
  patient: { name: "Ion Popescu", email: "ion@example.com", phone: "+40712345678" },
  doctor: { name: "Dr. Ionescu" },
  department: { name: "Cardiologie" },
}

const enabledSettings = { emailNotifications: true, smsNotifications: true }

describe("sendAppointmentNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.settings.findUnique.mockResolvedValue(enabledSettings)
    mockPrisma.notification.create.mockResolvedValue({})
  })

  it("sends email when sendEmail=true and global email enabled", async () => {
    await sendAppointmentNotification(mockAppt, "CONFIRMATION", { sendEmail: true, sendSMS: false })
    expect(sendEmail).toHaveBeenCalledOnce()
    expect(sendSMS).not.toHaveBeenCalled()
  })

  it("sends SMS when sendSMS=true and global SMS enabled", async () => {
    await sendAppointmentNotification(mockAppt, "CONFIRMATION", { sendEmail: false, sendSMS: true })
    expect(sendSMS).toHaveBeenCalledOnce()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("sends both when both flags true and both globally enabled", async () => {
    await sendAppointmentNotification(mockAppt, "REMINDER", { sendEmail: true, sendSMS: true })
    expect(sendEmail).toHaveBeenCalledOnce()
    expect(sendSMS).toHaveBeenCalledOnce()
  })

  it("does not send email when global emailNotifications=false", async () => {
    mockPrisma.settings.findUnique.mockResolvedValue({ emailNotifications: false, smsNotifications: true })
    await sendAppointmentNotification(mockAppt, "CONFIRMATION", { sendEmail: true, sendSMS: false })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("does not send SMS when global smsNotifications=false", async () => {
    mockPrisma.settings.findUnique.mockResolvedValue({ emailNotifications: true, smsNotifications: false })
    await sendAppointmentNotification(mockAppt, "CONFIRMATION", { sendEmail: false, sendSMS: true })
    expect(sendSMS).not.toHaveBeenCalled()
  })

  it("creates SENT notification record on successful email", async () => {
    await sendAppointmentNotification(mockAppt, "CONFIRMATION", { sendEmail: true, sendSMS: false })
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SENT",
          type: "EMAIL",
          event: "CONFIRMATION",
          appointmentId: "a1",
        }),
      })
    )
  })

  it("creates FAILED notification record when email send fails", async () => {
    vi.mocked(sendEmail).mockResolvedValueOnce({ success: false, error: "Auth error" })
    await sendAppointmentNotification(mockAppt, "CONFIRMATION", { sendEmail: true, sendSMS: false })
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED", error: "Auth error" }),
      })
    )
  })

  it("does not send email when patient has no email address", async () => {
    const apptNoEmail = { ...mockAppt, patient: { ...mockAppt.patient, email: null } }
    await sendAppointmentNotification(apptNoEmail, "CONFIRMATION", { sendEmail: true, sendSMS: false })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("does not throw when settings fetch fails", async () => {
    mockPrisma.settings.findUnique.mockRejectedValue(new Error("DB down"))
    await expect(
      sendAppointmentNotification(mockAppt, "REMINDER", { sendEmail: true, sendSMS: false })
    ).resolves.toBeUndefined()
  })

  it("sends correct SMS body for CANCELLATION event", async () => {
    await sendAppointmentNotification(mockAppt, "CANCELLATION", { sendEmail: false, sendSMS: true })
    const call = vi.mocked(sendSMS).mock.calls[0][0]
    expect(call.body).toContain("ANULATA")
  })
})
