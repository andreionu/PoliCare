import twilio from "twilio"

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

interface SendSMSParams {
  to: string
  body: string
}

interface SendSMSResult {
  success: boolean
  error?: string
}

function normalizePhone(phone: string): string {
  // Romanian numbers: 07xx or 02xx → +407xx / +402xx
  if (phone.startsWith("0")) return "+4" + phone
  return phone
}

export async function sendSMS({ to, body }: SendSMSParams): Promise<SendSMSResult> {
  try {
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: normalizePhone(to),
      body,
    })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[sms] Failed to send:", message)
    return { success: false, error: message }
  }
}
