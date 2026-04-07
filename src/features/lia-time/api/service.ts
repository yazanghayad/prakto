import { apiUrl } from '@/lib/api-client';
import type { TimeEntryDoc, TimeEntryPayload } from './types';

export async function getTimeEntries(userId: string): Promise<TimeEntryDoc[]> {
  const res = await fetch(apiUrl(`/api/lia-time?userId=${encodeURIComponent(userId)}`));
  if (!res.ok) return [];
  const json = await res.json();
  return (json.items as TimeEntryDoc[]) ?? [];
}

export async function createTimeEntry(data: TimeEntryPayload): Promise<TimeEntryDoc> {
  const res = await fetch(apiUrl('/api/lia-time'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte spara tidrapport.');
  }
  const json = await res.json();
  return json.item as TimeEntryDoc;
}

export async function updateTimeEntry(
  id: string,
  data: Partial<TimeEntryPayload>
): Promise<TimeEntryDoc> {
  const res = await fetch(apiUrl('/api/lia-time'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', itemId: id, data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte uppdatera tidrapport.');
  }
  const json = await res.json();
  return json.item as TimeEntryDoc;
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const res = await fetch(apiUrl('/api/lia-time'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', itemId: id })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte ta bort tidrapport.');
  }
}
