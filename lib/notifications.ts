import { prisma } from "@/lib/prisma"
import { sendEmail as sendEmailLib } from "@/lib/email"
import { sendSMS as sendSMSLib } from "@/lib/sms"

export type NotificationEvent = "CONFIRMATION" | "CANCELLATION" | "REMINDER" | "CUSTOM" | "BOOKING_RECEIVED"

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
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc">
      <div style="background:#0b2530;padding:28px 32px;text-align:center">
        <table role="presentation" align="center" style="margin:0 auto"><tr>
          <td style="padding-right:10px;vertical-align:middle">
            <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" stroke="#40A0D0" stroke-width="12" fill="none"/>
              <path d="M42 30V70 M42 30H58C68 30 68 45 58 45H42" stroke="#40A0D0" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </td>
          <td style="vertical-align:middle">
            <span style="font-size:24px;font-weight:800;color:#e2e8f0">Poli<span style="color:#40A0D0">Care</span></span>
          </td>
        </tr></table>
      </div>
      <div style="background:#ffffff;padding:32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
        <h2 style="margin:0 0 20px;color:#206070;font-size:20px">${title}</h2>
        <p style="color:#374151;margin:0 0 16px">Stimate/Stimată <strong>${data.patient.name}</strong>,</p>
        ${body}
      </div>
      <div style="background:#f1f5f9;padding:20px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
        <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6">
          Dacă aveți întrebări, contactați clinica noastră.<br/>
          Vă mulțumim că ați ales serviciile PoliCare.
        </p>
      </div>
    </div>
  `

  const apptDetails = `
    <ul style="color:#374151;line-height:1.8">
      <li><strong>Data:</strong> ${dateStr}</li>
      <li><strong>Ora:</strong> ${data.startTime}</li>
      <li><strong>Medic:</strong> ${data.doctor.name}</li>
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
        `<p style="color:#374151">Ne pare rău să vă informăm că programarea din <strong>${dateStr}</strong> la ora <strong>${data.startTime}</strong> cu ${data.doctor.name} a fost <strong style="color:#dc2626">anulată</strong>.</p>
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
    case "BOOKING_RECEIVED":
      return wrap(
        "Cerere de Programare Primită 📋",
        `<p style="color:#374151">Am primit cererea dumneavoastră de programare. O vom analiza și vă vom confirma în cel mai scurt timp.</p>
        ${apptDetails}
        <p style="color:#374151">Dacă aveți întrebări, nu ezitați să ne contactați.</p>`
      )
  }
}

// ─── SMS body templates ───────────────────────────────────────────────────────

function buildSMSBody(event: NotificationEvent, data: AppointmentData, customMessage?: string): string {
  const dateStr = new Date(data.date).toLocaleDateString("ro-RO")

  switch (event) {
    case "CONFIRMATION":
      return `Programarea la ${data.doctor.name} pe ${dateStr} la ora ${data.startTime} a fost CONFIRMATA. Va asteptam!`
    case "CANCELLATION":
      return `Programarea la ${data.doctor.name} pe ${dateStr} la ora ${data.startTime} a fost ANULATA. Va rugam sa ne contactati.`
    case "REMINDER":
      return `Reminder: Programare pe ${dateStr} la ora ${data.startTime} cu ${data.doctor.name}. Va asteptam!`
    case "CUSTOM":
      return customMessage ?? "Mesaj de la clinica."
    case "BOOKING_RECEIVED":
      return `Cererea de programare la ${data.doctor.name} pe ${dateStr} la ora ${data.startTime} a fost primita. Va vom confirma curand.`
  }
}

// ─── Subject map ──────────────────────────────────────────────────────────────

const EMAIL_SUBJECTS: Record<NotificationEvent, string> = {
  CONFIRMATION: "Programare Confirmată — Clinica",
  CANCELLATION: "Programare Anulată — Clinica",
  REMINDER: "Reminder Programare — Clinica",
  CUSTOM: "Mesaj de la Clinică",
  BOOKING_RECEIVED: "Cerere de Programare Primită — Clinica",
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
