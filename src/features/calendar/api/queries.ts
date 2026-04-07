import { queryOptions } from '@tanstack/react-query';
import { getCalendarEvents, getCalendarEvent, getAvailability } from './service';
import type { CalendarEventDoc, AvailabilityDoc } from './types';

export type { CalendarEventDoc, AvailabilityDoc };

// ─── Key Factories ─────────────────────────────────────────────

export const calendarKeys = {
  all: ['calendar'] as const,
  events: (userId: string, from?: string, to?: string) =>
    [...calendarKeys.all, 'events', userId, from, to] as const,
  event: (id: string) => [...calendarKeys.all, 'event', id] as const,
  availability: (userId: string) => [...calendarKeys.all, 'availability', userId] as const
};

// ─── Query Options ─────────────────────────────────────────────

export const calendarEventsOptions = (userId: string, from?: string, to?: string) =>
  queryOptions({
    queryKey: calendarKeys.events(userId, from, to),
    queryFn: () => getCalendarEvents(userId, from, to),
    enabled: !!userId
  });

export const calendarEventOptions = (id: string) =>
  queryOptions({
    queryKey: calendarKeys.event(id),
    queryFn: () => getCalendarEvent(id),
    enabled: !!id
  });

export const availabilityOptions = (userId: string) =>
  queryOptions({
    queryKey: calendarKeys.availability(userId),
    queryFn: () => getAvailability(userId),
    enabled: !!userId
  });
