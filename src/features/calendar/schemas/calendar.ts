import { z } from 'zod';

export const calendarEventSchema = z.object({
  title: z.string().min(2, 'Titel måste vara minst 2 tecken.'),
  description: z.string().max(500, 'Max 500 tecken.').optional(),
  startTime: z.string().min(1, 'Starttid krävs.'),
  endTime: z.string().min(1, 'Sluttid krävs.'),
  type: z.enum(['interview', 'meeting', 'reminder', 'other'], {
    message: 'Välj en typ.'
  }),
  location: z.string().optional(),
  meetingUrl: z.string().url('Ange en giltig URL.').or(z.literal('')).optional()
});

export type CalendarEventFormValues = z.infer<typeof calendarEventSchema>;

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string().min(1, 'Starttid krävs.'),
  endTime: z.string().min(1, 'Sluttid krävs.'),
  isRecurring: z.boolean()
});
