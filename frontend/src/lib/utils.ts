import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null | any, formatStr: string = "d 'de' MMMM, yyyy"): string {
  if (!dateString) return 'N/A';
  try {
    const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return typeof dateString === 'string' ? dateString : 'N/A';
    }
    return format(d, formatStr, { locale: es });
  } catch {
    return typeof dateString === 'string' ? dateString : 'N/A';
  }
}

export function formatTime(dateString?: string | null | any): string {
  if (!dateString) return '';
  try {
    const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return '';
    }
    return format(d, 'HH:mm', { locale: es });
  } catch {
    return '';
  }
}

export function formatDateTime(dateString?: string | null | any): string {
  if (!dateString) return 'N/A';
  try {
    const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return typeof dateString === 'string' ? dateString : 'N/A';
    }
    return format(d, "d 'de' MMM, HH:mm 'hrs'", { locale: es });
  } catch {
    return typeof dateString === 'string' ? dateString : 'N/A';
  }
}

export function calculateAge(birthDateString?: string | null | any): string {
  if (!birthDateString) return 'N/A';
  try {
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return 'N/A';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} años`;
  } catch {
    return 'N/A';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
