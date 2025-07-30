import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  if (!dateString) return '';
  // Test if the date string already contains time information
  if (dateString.includes('T')) {
      return new Date(dateString).toLocaleDateString('pt-BR', {
          timeZone: 'UTC' // Treat the input as UTC to prevent double-offsetting
      });
  }
  // For date-only strings, add T00:00:00 to ensure consistent parsing
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('pt-BR');
}

export function formatDateTimeForInput(isoDate: string | null | undefined): string {
    if (!isoDate) return '';
    try {
        // The date from Supabase is in ISO 8601 format (UTC).
        // We just need to format it to what <input type="datetime-local"> expects,
        // which is `YYYY-MM-DDTHH:mm`. We can do this by slicing the string.
        // We assume the date stored is the local date we want.
        const date = new Date(isoDate);
        
        // To prevent timezone conversion issues on display, we construct the string manually
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
        console.error("Error formatting date for input:", e);
        return '';
    }
}
