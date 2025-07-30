import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  // Adiciona T00:00:00 para garantir que a data seja interpretada no fuso horário local
  // e evitar problemas de hidratação com fuso horário (timezone).
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('pt-BR');
}

export function formatDateTimeForInput(isoDate: string | null | undefined): string {
    if (!isoDate) return '';
    try {
        const date = new Date(isoDate);
        // Subtrai o offset do fuso horário para obter a hora local correta
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        // Formata para 'YYYY-MM-DDTHH:mm'
        return localDate.toISOString().slice(0, 16);
    } catch (e) {
        console.error("Error formatting date for input:", e);
        return '';
    }
}