
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  if (!dateString) return '';
  // Force display in UTC to avoid local timezone shifts for dates without time
  return new Date(dateString).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(dateTimeString: string) {
    if (!dateTimeString) return '';
    // Display the date and time as it is stored, assuming it was input correctly.
    // The 'T' separates date and time, so we replace it with a space.
    return dateTimeString.substring(0, 16).replace('T', ' ');
}

export function formatDateTimeForInput(isoDate: string | null | undefined): string {
    if (!isoDate) return '';
    // The date from Supabase is already a string that datetime-local input can use.
    // Just return it directly.
    return isoDate.slice(0, 16);
}

export function exportToExcel(data: any[], fileName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
