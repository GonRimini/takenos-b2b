import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Map display email to the effective API email when needed
export function getApiEmailForUser(displayEmail: string): string {
  const normalized = displayEmail?.toLowerCase().trim()
  if (!normalized) return displayEmail
  if (normalized === "fermin@takenos.com") return "geraldinebrisa2017@gmail.com"
  return normalized
}
