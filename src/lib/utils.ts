import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string to UTC format for tooltips
 * Input can be any valid date string (ISO 8601, local timezone, etc.)
 * Output is always in UTC format: "Apr 11, 2025, 02:30 PM UTC"
 */
export function formatUTC(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) + ' UTC'
  } catch {
    return 'Invalid date'
  }
}
