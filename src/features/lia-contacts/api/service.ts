import { apiUrl } from '@/lib/api-client';
import type { ContactDoc, ContactPayload } from './types';

export async function getContacts(userId: string): Promise<ContactDoc[]> {
  const res = await fetch(apiUrl(`/api/lia-contacts?userId=${encodeURIComponent(userId)}`));
  if (!res.ok) return [];
  const json = await res.json();
  return (json.items as ContactDoc[]) ?? [];
}

export async function createContact(data: ContactPayload): Promise<ContactDoc> {
  const res = await fetch(apiUrl('/api/lia-contacts'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte spara kontakt.');
  }
  const json = await res.json();
  return json.item as ContactDoc;
}

export async function updateContact(
  id: string,
  data: Partial<ContactPayload>
): Promise<ContactDoc> {
  const res = await fetch(apiUrl('/api/lia-contacts'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', itemId: id, data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte uppdatera kontakt.');
  }
  const json = await res.json();
  return json.item as ContactDoc;
}

export async function deleteContact(id: string): Promise<void> {
  const res = await fetch(apiUrl('/api/lia-contacts'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', itemId: id })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte ta bort kontakt.');
  }
}
