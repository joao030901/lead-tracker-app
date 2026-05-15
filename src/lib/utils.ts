import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Candidate } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatPhoneNumberForWhatsApp = (phone: string) => {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `55${digitsOnly.substring(1)}`;
  }
  if (digitsOnly.length === 11 || digitsOnly.length === 10) {
     return `55${digitsOnly}`;
  }
  return digitsOnly;
};

export const fillTemplate = (template: string, candidate: Candidate) => {
  if(!candidate) return template;
  return template
    .replace(/{nome_candidato}/g, candidate.name || '')
    .replace(/{curso_candidato}/g, candidate.course || '');
};

export const formatCourseName = (course: string | null | undefined) => {
    if (!course) return 'N/A';
    return course.trim();
};

export const safeParseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const cleaned = String(dateStr).trim();
  if (cleaned === '' || cleaned.toLowerCase() === 'null') return null;
  
  const ddmmyyyyMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    const rest = ddmmyyyyMatch[4].trim();
    
    if (rest) {
        const hmsMatch = rest.match(/(\d{1,2}):(\d{1,2})(:(\d{1,2}))?/);
        if (hmsMatch) {
            const hours = parseInt(hmsMatch[1], 10);
            const minutes = parseInt(hmsMatch[2], 10);
            const seconds = hmsMatch[4] ? parseInt(hmsMatch[4], 10) : 0;
            return new Date(year, month, day, hours, minutes, seconds);
        }
    }
    return new Date(year, month, day);
  }

  let date = parseISO(cleaned);
  if (isValid(date)) return date;

  date = parseISO(cleaned.replace(' ', 'T'));
  if (isValid(date)) return date;

  date = new Date(cleaned);
  if (isValid(date)) return date;

  return null;
};

export const formatDateDisplay = (dateString: string | null | undefined, formatStr: string = 'dd/MM/yyyy') => {
  const date = safeParseDate(dateString);
  if (!date) return 'N/A';
  return format(date, formatStr, { locale: ptBR });
}

export const formatCPF = (cpf: string | null | undefined) => {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return digits;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};
