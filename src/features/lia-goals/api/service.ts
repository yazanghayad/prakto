import { apiUrl } from '@/lib/api-client';
import type { LiaGoalDoc, LiaGoalPayload } from './types';

export async function getLiaGoals(userId: string): Promise<LiaGoalDoc[]> {
  const res = await fetch(apiUrl(`/api/lia-goals?userId=${encodeURIComponent(userId)}`));
  if (!res.ok) return [];
  const json = await res.json();
  return (json.items as LiaGoalDoc[]) ?? [];
}

export async function createLiaGoal(data: LiaGoalPayload): Promise<LiaGoalDoc> {
  const res = await fetch(apiUrl('/api/lia-goals'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte skapa mål.');
  }
  const json = await res.json();
  return json.item as LiaGoalDoc;
}

export async function updateLiaGoal(
  id: string,
  data: Partial<LiaGoalPayload & { completed: boolean; completedAt: string | null }>
): Promise<LiaGoalDoc> {
  const res = await fetch(apiUrl('/api/lia-goals'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', itemId: id, data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte uppdatera mål.');
  }
  const json = await res.json();
  return json.item as LiaGoalDoc;
}

export async function deleteLiaGoal(id: string): Promise<void> {
  const res = await fetch(apiUrl('/api/lia-goals'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', itemId: id })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte ta bort mål.');
  }
}
