import { prisma } from "@/lib/prisma"
import { sendEmail as sendEmailLib } from "@/lib/email"
import { sendSMS as sendSMSLib } from "@/lib/sms"

export type NotificationEvent = "CONFIRMATION" | "CANCELLATION" | "REMINDER" | "CUSTOM"

interface AppointmentData {
  id: string
  date: Date
  startTime: string
  patient: {
    name: string
    email: string | null
    phone: string
  }
  doctor: {
    name: string
  }
  department: {
    name: string
  } | null
}

interface NotifyOptions {
  sendEmail: boolean
  sendSMS: boolean
  customMessage?: string
}

// ─── Email HTML templates ─────────────────────────────────────────────────────

function buildEmailHtml(event: NotificationEvent, data: AppointmentData, customMessage?: string): string {
  const dateStr = new Date(data.date).toLocaleDateString("ro-RO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const wrap = (title: string, body: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff">
      <div style="border-bottom:2px solid #0ea5e9;padding-bottom:16px;margin-bottom:24px">
        <h2 style="margin:0;color:#0ea5e9;font-size:20px">${title}</h2>
      </div>
      <p style="color:#374151">Stimate/Stimată <strong>${data.patient.name}</strong>,</p>
      ${body}
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb"/>
      <p style="color:#9ca3af;font-size:12px">
        Dacă aveți întrebări, contactați clinica noastră.<br/>
        Vă mulțumim că ați ales serviciile noastre.
      </p>
    </div>
  `

  const apptDetails = `
    <ul style="color:#374151;line-height:1.8">
      <li><strong>Data:</strong> ${dateStr}</li>
      <li><strong>Ora:</strong> ${data.startTime}</li>
      <li><strong>Medic:</strong> Dr. ${data.doctor.name}</li>
      <li><strong>Departament:</strong> ${data.department?.name ?? "—"}</li>
    </ul>
  `

  switch (event) {
    case "CONFIRMATION":
      return wrap(
        "Programare Confirmată ✓",
        `<p style="color:#374151">Programarea dumneavoastră a fost <strong style="color:#16a34a">confirmată</strong>.</p>
        ${apptDetails}
        <p style="color:#374151">Vă rugăm să vă prezentați cu 10 minute înainte de programare.</p>`
      )
    case "CANCELLATION":
      return wrap(
        "Programare Anulată",
        `<p style="color:#374151">Ne pare rău să vă informăm că programarea din <strong>${dateStr}</strong> la ora <strong>${data.startTime}</strong> cu Dr. ${data.doctor.name} a fost <strong style="color:#dc2626">anulată</strong>.</p>
        <p style="color:#374151">Vă rugăm să ne contactați pentru a stabili o nouă programare.</p>`
      )
    case "REMINDER":
      return wrap(
        "Reminder Programare 🔔",
        `<p style="color:#374151">Acesta este un reminder pentru programarea dumneavoastră.</p>
        ${apptDetails}
        <p style="color:#374151">Vă rugăm să vă prezentați cu 10 minute înainte.</p>`
      )
    case "CUSTOM":
      return wrap("Mesaj de la Clinică", `<p style="color:#374151">${customMessage ?? ""}</p>`)
  }
}

// ─── SMS body templates ───────────────────────────────────────────────────────

function buildSMSBody(event: NotificationEvent, data: AppointmentData, customMessage?: string): string {
  const dateStr = new Date(data.date).toLocaleDateString("ro-RO")

  switch (event) {
    case "CONFIRMATION":
      return `Programarea la Dr. ${data.doctor.name} pe ${dateStr} la ora ${data.startTime} a fost CONFIRMATA. Va asteptam!`
    case "CANCELLATION":
      return `Programarea la Dr. ${data.doctor.name} pe ${dateStr} la ora ${data.startTime} a fost ANULATA. Va rugam sa ne contactati.`
    case "REMINDER":
      return `Reminder: Programare pe ${dateStr} la ora ${data.startTime} cu Dr. ${data.doctor.name}. Va asteptam!`
    case "CUSTOM":
      return customMessage ?? "Mesaj de la clinica."
  }
}

// ─── Subject map ──────────────────────────────────────────────────────────────

const EMAIL_SUBJECTS: Record<NotificationEvent, string> = {
  CONFIRMATION: "Programare Confirmată — Clinica",
  CANCELLATION: "Programare Anulată — Clinica",
  REMINDER: "Reminder Programare — Clinica",
  CUSTOM: "Mesaj de la Clinică",
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export async function sendAppointmentNotification(
  appointment: AppointmentData,
  event: NotificationEvent,
  options: NotifyOptions
): Promise<void> {
  // Read global settings (don't throw if unavailable)
  let settings: { emailNotifications: boolean; smsNotifications: boolean } | null = null
  try {
    settings = await prisma.settings.findUnique({
      where: { id: "clinic_settings" },
      select: { emailNotifications: true, smsNotifications: true },
    })
  } catch {
    // fall back to option flags only
  }

  const shouldEmail = options.sendEmail && (settings?.emailNotifications ?? true)
  const shouldSMS = options.sendSMS && (settings?.smsNotifications ?? false)

  const emailHtml = buildEmailHtml(event, appointment, options.customMessage)
  const smsBody = buildSMSBody(event, appointment, options.customMessage)

  const tasks: Promise<void>[] = []

  if (shouldEmail && appointment.patient.email) {
    tasks.push(
      sendEmailLib({
        to: appointment.patient.email,
        subject: EMAIL_SUBJECTS[event],
        html: emailHtml,
      }).then(async (result) => {
        await prisma.notification.create({
          data: {
            appointmentId: appointment.id,
            type: "EMAIL",
            event,
            status: result.success ? "SENT" : "FAILED",
            recipient: appointment.patient.email!,
            message: emailHtml,
            error: result.error ?? null,
          },
        })
      })
    )
  }

  if (shouldSMS) {
    tasks.push(
      sendSMSLib({
        to: appointment.patient.phone,
        body: smsBody,
      }).then(async (result) => {
        await prisma.notification.create({
          data: {
            appointmentId: appointment.id,
            type: "SMS",
            event,
            status: result.success ? "SENT" : "FAILED",
            recipient: appointment.patient.phone,
            message: smsBody,
            error: result.error ?? null,
          },
        })
      })
    )
  }

  // Wait for all; absorb failures — appointment update is never blocked
  await Promise.allSettled(tasks)
}
