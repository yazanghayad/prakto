import { apiUrl } from '@/lib/api-client';
import type { JournalEntryDoc, JournalEntryPayload } from './types';

export async function getJournalEntries(userId: string): Promise<JournalEntryDoc[]> {
  const res = await fetch(apiUrl(`/api/lia-journal?userId=${encodeURIComponent(userId)}`));
  if (!res.ok) return [];
  const json = await res.json();
  return (json.items as JournalEntryDoc[]) ?? [];
}

export async function createJournalEntry(data: JournalEntryPayload): Promise<JournalEntryDoc> {
  const res = await fetch(apiUrl('/api/lia-journal'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte spara dagboksinlägg.');
  }
  const json = await res.json();
  return json.item as JournalEntryDoc;
}

export async function updateJournalEntry(
  id: string,
  data: Partial<JournalEntryPayload>
): Promise<JournalEntryDoc> {
  const res = await fetch(apiUrl('/api/lia-journal'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', itemId: id, data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte uppdatera dagboksinlägg.');
  }
  const json = await res.json();
  return json.item as JournalEntryDoc;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const res = await fetch(apiUrl('/api/lia-journal'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', itemId: id })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte ta bort dagboksinlägg.');
  }
}
