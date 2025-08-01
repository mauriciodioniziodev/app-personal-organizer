
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  if (!dateString) return '';
  // Force display in UTC to avoid local timezone shifts
  return new Date(dateString).toLocaleDateString('pt-BR', {
    timeZone: 'UTC'
  });
}

export function formatDateTime(dateTimeString: string) {
    if (!dateTimeString) return '';
    // Force display in UTC to avoid local timezone shifts
    return new Date(dateTimeString).toLocaleString('pt-BR', {
        timeZone: 'UTC',
        dateStyle: 'long',
        timeStyle: 'short'
    });
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
