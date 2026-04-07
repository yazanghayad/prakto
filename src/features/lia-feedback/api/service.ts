import { apiUrl } from '@/lib/api-client';
import type { FeedbackDoc, FeedbackPayload } from './types';

export async function getFeedback(userId: string): Promise<FeedbackDoc[]> {
  const res = await fetch(apiUrl(`/api/lia-feedback?userId=${encodeURIComponent(userId)}`));
  if (!res.ok) return [];
  const json = await res.json();
  return (json.items as FeedbackDoc[]) ?? [];
}

export async function createFeedback(data: FeedbackPayload): Promise<FeedbackDoc> {
  const res = await fetch(apiUrl('/api/lia-feedback'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte spara feedback.');
  }
  const json = await res.json();
  return json.item as FeedbackDoc;
}

export async function deleteFeedback(id: string): Promise<void> {
  const res = await fetch(apiUrl('/api/lia-feedback'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', itemId: id })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte ta bort feedback.');
  }
}
