import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

interface SendEmailResult {
  success: boolean
  error?: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<SendEmailResult> {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Clinica <onboarding@resend.dev>",
      to,
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[email] Failed to send:", message)
    return { success: false, error: message }
  }
}
