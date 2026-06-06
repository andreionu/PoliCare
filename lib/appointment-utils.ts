const TERMINAL = new Set(["FINALIZAT", "ANULAT", "NEPREZENTARE", "INCHEIATA"])

type WithStringStatus<T> = Omit<T, "status"> & { status: string }

/**
 * Returns the appointment with status overridden to "INCHEIATA" if 24 h have
 * elapsed since its end time and it was not already in a terminal state.
 */
export function withExpiredStatus<
  T extends { status: string; date: Date | string; endTime: string; startTime: string },
>(appt: T): WithStringStatus<T> {
  if (TERMINAL.has(appt.status)) return appt as WithStringStatus<T>

  const dateStr =
    appt.date instanceof Date
      ? appt.date.toISOString().slice(0, 10)
      : String(appt.date).slice(0, 10)

  const time = appt.endTime || appt.startTime
  const apptEnd = new Date(`${dateStr}T${time}:00`)
  const hoursPassed = (Date.now() - apptEnd.getTime()) / 3_600_000

  if (hoursPassed >= 24) return { ...appt, status: "INCHEIATA" }
  return appt as WithStringStatus<T>
}

export function applyExpiredStatuses<
  T extends { status: string; date: Date | string; endTime: string; startTime: string },
>(appts: T[]): WithStringStatus<T>[] {
  return appts.map(withExpiredStatus)
}
