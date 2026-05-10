import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

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
    await transporter.sendMail({
      from: `Clinica <${process.env.GMAIL_USER}>`,
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
