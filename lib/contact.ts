export function normalizeEmail(email?: string | null) {
  const value = email?.trim().toLowerCase()
  return value ? value : null
}

export function normalizePhone(phone?: string | null) {
  const cleaned = phone?.trim().replace(/[\s\-().]/g, "")
  if (!cleaned) return null

  if (cleaned.startsWith("+")) return cleaned
  if (cleaned.startsWith("40")) return `+${cleaned}`
  if (cleaned.startsWith("0")) return `+4${cleaned}`

  return cleaned
}
