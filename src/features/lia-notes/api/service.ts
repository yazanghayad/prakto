import { apiUrl } from '@/lib/api-client';
import type { LiaNoteDoc, LiaNotePayload } from './types';

export async function getLiaNotes(userId: string): Promise<LiaNoteDoc[]> {
  const res = await fetch(apiUrl(`/api/lia-notes?userId=${encodeURIComponent(userId)}`));
  if (!res.ok) return [];
  const json = await res.json();
  return (json.items as LiaNoteDoc[]) ?? [];
}

export async function getLiaNote(id: string): Promise<LiaNoteDoc> {
  const res = await fetch(apiUrl(`/api/lia-notes?noteId=${encodeURIComponent(id)}`));
  if (!res.ok) throw new Error('Kunde inte hämta anteckning.');
  const json = await res.json();
  return json.item as LiaNoteDoc;
}

export async function createLiaNote(data: LiaNotePayload): Promise<LiaNoteDoc> {
  const res = await fetch(apiUrl('/api/lia-notes'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte spara anteckning.');
  }
  const json = await res.json();
  return json.item as LiaNoteDoc;
}

export async function updateLiaNote(
  id: string,
  data: Partial<LiaNotePayload & { pinned: boolean }>
): Promise<LiaNoteDoc> {
  const res = await fetch(apiUrl('/api/lia-notes'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', itemId: id, data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte uppdatera anteckning.');
  }
  const json = await res.json();
  return json.item as LiaNoteDoc;
}

export async function deleteLiaNote(id: string): Promise<void> {
  const res = await fetch(apiUrl('/api/lia-notes'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', itemId: id })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte ta bort anteckning.');
  }
}
