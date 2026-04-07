import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  setAvailability
} from './service';
import { calendarKeys } from './queries';
import type { CalendarEventPayload, AvailabilityPayload } from './types';

export const createEventMutation = mutationOptions({
  mutationFn: (data: CalendarEventPayload) => createCalendarEvent(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: calendarKeys.all });
  }
});

export const updateEventMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: Partial<CalendarEventPayload> }) =>
    updateCalendarEvent(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: calendarKeys.all });
  }
});

export const deleteEventMutation = mutationOptions({
  mutationFn: (id: string) => deleteCalendarEvent(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: calendarKeys.all });
  }
});

export const setAvailabilityMutation = mutationOptions({
  mutationFn: (slots: AvailabilityPayload[]) => setAvailability(slots),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: calendarKeys.all });
  }
});
