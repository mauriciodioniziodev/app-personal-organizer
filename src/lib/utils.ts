
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

export function exportToPdf(columns: { title: string, dataKey: string }[], data: any[], fileName: string, reportTitle: string) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(reportTitle, 14, 22);

  // Convert array of objects to array of arrays
  const bodyData = data.map(row => columns.map(col => row[col.dataKey]));


  // Add table
  (doc as any).autoTable({
      head: [columns.map(c => c.title)],
      body: bodyData,
      startY: 30,
      headStyles: { fillColor: [35, 45, 63] }, // Customize header color
      didDrawPage: function(data: any) {
        // Footer
        const str = "Página " + doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
      }
  });

  doc.save(`${fileName}.pdf`);
}
