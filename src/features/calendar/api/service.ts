// ============================================================
// Calendar Service — Data Access Layer
// ============================================================

import { apiUrl } from '@/lib/api-client';
import type {
  CalendarEventDoc,
  CalendarEventPayload,
  AvailabilityDoc,
  AvailabilityPayload
} from './types';

// ─── Calendar Events ──────────────────────────────────────────

/**
 * Get all calendar events for a user, optionally filtered by date range.
 */
export async function getCalendarEvents(
  userId: string,
  from?: string,
  to?: string
): Promise<CalendarEventDoc[]> {
  const params = new URLSearchParams({ userId });
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const res = await fetch(apiUrl(`/api/calendar?${params.toString()}`));
  if (!res.ok) return [];
  const json = await res.json();
  return (json.events as CalendarEventDoc[]) ?? [];
}

/**
 * Get a single calendar event.
 */
export async function getCalendarEvent(id: string): Promise<CalendarEventDoc> {
  const res = await fetch(apiUrl(`/api/calendar?id=${encodeURIComponent(id)}`));
  if (!res.ok) {
    throw new Error('Kunde inte hämta händelse.');
  }
  const json = await res.json();
  return json.event as CalendarEventDoc;
}

/**
 * Create a new calendar event.
 */
export async function createCalendarEvent(data: CalendarEventPayload): Promise<CalendarEventDoc> {
  const res = await fetch(apiUrl('/api/calendar'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte skapa händelse.');
  }
  const json = await res.json();
  return json.event as CalendarEventDoc;
}

/**
 * Update a calendar event.
 */
export async function updateCalendarEvent(
  id: string,
  data: Partial<CalendarEventPayload>
): Promise<CalendarEventDoc> {
  const res = await fetch(apiUrl('/api/calendar'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', eventId: id, data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte uppdatera händelse.');
  }
  const json = await res.json();
  return json.event as CalendarEventDoc;
}

/**
 * Delete a calendar event.
 */
export async function deleteCalendarEvent(id: string): Promise<void> {
  const res = await fetch(apiUrl('/api/calendar'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', eventId: id })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte ta bort händelse.');
  }
}

// ─── Availability ─────────────────────────────────────────────

/**
 * Get all availability slots for a user.
 */
export async function getAvailability(userId: string): Promise<AvailabilityDoc[]> {
  const res = await fetch(
    apiUrl(`/api/calendar/availability?userId=${encodeURIComponent(userId)}`)
  );
  if (!res.ok) return [];
  const json = await res.json();
  return (json.slots as AvailabilityDoc[]) ?? [];
}

/**
 * Set (create or replace) availability for a user.
 */
export async function setAvailability(slots: AvailabilityPayload[]): Promise<AvailabilityDoc[]> {
  const res = await fetch(apiUrl('/api/calendar/availability'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slots })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte spara tillgänglighet.');
  }
  const json = await res.json();
  return (json.slots as AvailabilityDoc[]) ?? [];
}
