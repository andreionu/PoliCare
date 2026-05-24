import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Ensures exactly one "Dr. " prefix regardless of what's stored in DB
export function formatDoctorName(name: string): string {
  return `Dr. ${name.replace(/^(Dr\.\s*)+/i, "")}`
}
