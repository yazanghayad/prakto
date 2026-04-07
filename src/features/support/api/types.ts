import type { Models } from 'appwrite';

// ─── Document type (from Appwrite) ───────────────────────────

export interface SupportTicketDoc extends Models.Document {
  userId: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
}

// ─── Create payload ──────────────────────────────────────────

export interface SupportTicketPayload {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}

// ─── API response ────────────────────────────────────────────

export interface SupportTicketsResponse {
  total: number;
  tickets: SupportTicketDoc[];
}

// ─── Constants ───────────────────────────────────────────────

export const SUPPORT_CATEGORIES = [
  { value: 'account', label: 'Konto & Profil' },
  { value: 'applications', label: 'Ansökningar' },
  { value: 'technical', label: 'Tekniskt problem' },
  { value: 'billing', label: 'Betalning & Faktura' },
  { value: 'feedback', label: 'Feedback & Förslag' },
  { value: 'other', label: 'Övrigt' }
] as const;

export const TICKET_STATUS_LABELS: Record<string, string> = {
  open: 'Öppet',
  in_progress: 'Pågår',
  resolved: 'Löst',
  closed: 'Stängt'
};
