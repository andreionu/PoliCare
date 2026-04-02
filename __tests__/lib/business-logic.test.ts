import { describe, it, expect } from "vitest"

// ─── Attendance Rate ──────────────────────────────────────────────────────────
function calcAttendanceRate(finished: number, noShow: number): number | null {
  const denom = finished + noShow
  return denom > 0 ? Math.round((finished / denom) * 100) : null
}

describe("calcAttendanceRate", () => {
  it("returns null when no appointments", () => {
    expect(calcAttendanceRate(0, 0)).toBeNull()
  })

  it("returns 100 when all finished, no no-shows", () => {
    expect(calcAttendanceRate(10, 0)).toBe(100)
  })

  it("returns 0 when all no-shows", () => {
    expect(calcAttendanceRate(0, 5)).toBe(0)
  })

  it("rounds correctly", () => {
    expect(calcAttendanceRate(2, 1)).toBe(67) // 66.666... → 67
  })

  it("handles equal finished and no-show", () => {
    expect(calcAttendanceRate(5, 5)).toBe(50)
  })
})

// ─── Booking Wizard Validation ────────────────────────────────────────────────
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "")
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePhone(phone: string): boolean {
  return /^[0-9+\s()-]{10,20}$/.test(phone)
}

describe("sanitizeInput", () => {
  it("trims whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello")
  })

  it("strips < and >", () => {
    expect(sanitizeInput("<script>alert(1)</script>")).toBe("scriptalert(1)/script")
  })

  it("leaves normal text unchanged", () => {
    expect(sanitizeInput("Ion Popescu")).toBe("Ion Popescu")
  })
})

describe("validateEmail", () => {
  it("accepts valid emails", () => {
    expect(validateEmail("user@example.com")).toBe(true)
    expect(validateEmail("ion.popescu@clinic.ro")).toBe(true)
  })

  it("rejects emails without @", () => {
    expect(validateEmail("notanemail")).toBe(false)
  })

  it("rejects emails without domain", () => {
    expect(validateEmail("user@")).toBe(false)
  })

  it("rejects empty string", () => {
    expect(validateEmail("")).toBe(false)
  })
})

describe("validatePhone", () => {
  it("accepts Romanian mobile number", () => {
    expect(validatePhone("0712345678")).toBe(true)
  })

  it("accepts international format", () => {
    expect(validatePhone("+40712345678")).toBe(true)
  })

  it("accepts number with spaces", () => {
    expect(validatePhone("07 12 34 56 78")).toBe(true)
  })

  it("rejects too short", () => {
    expect(validatePhone("0712")).toBe(false)
  })

  it("rejects letters", () => {
    expect(validatePhone("abcdefghij")).toBe(false)
  })
})

// ─── Appointment End Time Calculation ─────────────────────────────────────────
function calcEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60)
  const endMins = totalMinutes % 60
  return `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`
}

describe("calcEndTime", () => {
  it("adds 30 minutes correctly", () => {
    expect(calcEndTime("09:00", 30)).toBe("09:30")
  })

  it("handles hour rollover", () => {
    expect(calcEndTime("09:45", 30)).toBe("10:15")
  })

  it("handles exact hour boundary", () => {
    expect(calcEndTime("10:30", 30)).toBe("11:00")
  })

  it("handles 60 minute duration", () => {
    expect(calcEndTime("14:00", 60)).toBe("15:00")
  })

  it("handles late evening times", () => {
    expect(calcEndTime("19:30", 30)).toBe("20:00")
  })
})

// ─── Placeholder CNP Generation ───────────────────────────────────────────────
function generatePlaceholderCnp(phone: string, timestamp: number): string {
  return `BOOKING${timestamp}${phone.replace(/\D/g, "").slice(-4)}`
}

describe("generatePlaceholderCnp", () => {
  it("starts with BOOKING prefix", () => {
    expect(generatePlaceholderCnp("0712345678", 1700000000000)).toMatch(/^BOOKING/)
  })

  it("ends with last 4 digits of phone", () => {
    const cnp = generatePlaceholderCnp("0712345678", 1700000000000)
    expect(cnp.endsWith("5678")).toBe(true)
  })

  it("strips non-digits from phone", () => {
    const cnp = generatePlaceholderCnp("+40 71 234 5678", 1700000000000)
    expect(cnp.endsWith("5678")).toBe(true)
  })

  it("two calls with different timestamps produce unique values", () => {
    const a = generatePlaceholderCnp("0712345678", 1000)
    const b = generatePlaceholderCnp("0712345678", 2000)
    expect(a).not.toBe(b)
  })
})

// ─── Relative Time Formatting ─────────────────────────────────────────────────
function formatRelativeTime(dateStr: string, now: Date): string {
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Acum"
  if (diffMin < 60) return `Acum ${diffMin} ${diffMin === 1 ? "minut" : "minute"}`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `Acum ${diffHr} ${diffHr === 1 ? "oră" : "ore"}`
  const diffDays = Math.floor(diffHr / 24)
  return `Acum ${diffDays} ${diffDays === 1 ? "zi" : "zile"}`
}

describe("formatRelativeTime", () => {
  const now = new Date("2026-03-24T12:00:00Z")

  it("returns 'Acum' for less than 1 minute", () => {
    const recent = new Date("2026-03-24T11:59:30Z").toISOString()
    expect(formatRelativeTime(recent, now)).toBe("Acum")
  })

  it("returns singular 'minut' for exactly 1 minute", () => {
    const oneMin = new Date("2026-03-24T11:59:00Z").toISOString()
    expect(formatRelativeTime(oneMin, now)).toBe("Acum 1 minut")
  })

  it("returns plural 'minute' for 5 minutes", () => {
    const fiveMin = new Date("2026-03-24T11:55:00Z").toISOString()
    expect(formatRelativeTime(fiveMin, now)).toBe("Acum 5 minute")
  })

  it("returns singular 'oră' for 1 hour", () => {
    const oneHour = new Date("2026-03-24T11:00:00Z").toISOString()
    expect(formatRelativeTime(oneHour, now)).toBe("Acum 1 oră")
  })

  it("returns plural 'ore' for 3 hours", () => {
    const threeHours = new Date("2026-03-24T09:00:00Z").toISOString()
    expect(formatRelativeTime(threeHours, now)).toBe("Acum 3 ore")
  })

  it("returns singular 'zi' for 1 day", () => {
    const oneDay = new Date("2026-03-23T12:00:00Z").toISOString()
    expect(formatRelativeTime(oneDay, now)).toBe("Acum 1 zi")
  })

  it("returns plural 'zile' for 3 days", () => {
    const threeDays = new Date("2026-03-21T12:00:00Z").toISOString()
    expect(formatRelativeTime(threeDays, now)).toBe("Acum 3 zile")
  })
})
