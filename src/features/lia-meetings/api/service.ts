import { apiUrl } from '@/lib/api-client';
import type { MentorMeetingDoc, MentorMeetingPayload } from './types';

export async function getMeetings(userId: string): Promise<MentorMeetingDoc[]> {
  const res = await fetch(apiUrl(`/api/lia-meetings?userId=${encodeURIComponent(userId)}`));
  if (!res.ok) return [];
  const json = await res.json();
  return (json.items as MentorMeetingDoc[]) ?? [];
}

export async function createMeeting(data: MentorMeetingPayload): Promise<MentorMeetingDoc> {
  const res = await fetch(apiUrl('/api/lia-meetings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte spara möte.');
  }
  const json = await res.json();
  return json.item as MentorMeetingDoc;
}

export async function updateMeeting(
  id: string,
  data: Partial<MentorMeetingPayload>
): Promise<MentorMeetingDoc> {
  const res = await fetch(apiUrl('/api/lia-meetings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', itemId: id, data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte uppdatera möte.');
  }
  const json = await res.json();
  return json.item as MentorMeetingDoc;
}

export async function deleteMeeting(id: string): Promise<void> {
  const res = await fetch(apiUrl('/api/lia-meetings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', itemId: id })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte ta bort möte.');
  }
}
