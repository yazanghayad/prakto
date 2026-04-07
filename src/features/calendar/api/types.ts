import type { Models } from 'appwrite';

// ─── Calendar Event Types ─────────────────────────────────────

export const EVENT_TYPES = ['interview', 'meeting', 'reminder', 'other'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = ['scheduled', 'completed', 'cancelled'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface CalendarEventDoc extends Models.Document {
  userId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  type: EventType;
  status: EventStatus;
  relatedId: string;
  location: string;
  meetingUrl: string;
}

export type CalendarEventPayload = {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: EventType;
  location?: string;
  meetingUrl?: string;
  relatedId?: string;
};

// ─── Availability Types ───────────────────────────────────────

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export interface AvailabilityDoc extends Models.Document {
  userId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

export type AvailabilityPayload = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
};

export type CalendarFilters = {
  userId?: string;
  from?: string;
  to?: string;
  type?: EventType;
};
