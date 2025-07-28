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
