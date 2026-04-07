import { apiUrl } from '@/lib/api-client';
import type { SupportTicketDoc, SupportTicketPayload, SupportTicketsResponse } from './types';

export async function getSupportTickets(userId: string): Promise<SupportTicketsResponse> {
  const res = await fetch(apiUrl(`/api/support?userId=${encodeURIComponent(userId)}`));
  if (!res.ok) {
    return { total: 0, tickets: [] };
  }
  return res.json();
}

export async function createSupportTicket(data: SupportTicketPayload): Promise<SupportTicketDoc> {
  const res = await fetch(apiUrl('/api/support'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte skicka supportärende.');
  }
  const json = await res.json();
  return json.item as SupportTicketDoc;
}
