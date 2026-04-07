'use client';

import { useState, useMemo, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  createEventMutation,
  updateEventMutation,
  deleteEventMutation,
  setAvailabilityMutation
} from '../api/mutations';
import type {
  CalendarEventDoc,
  CalendarEventPayload,
  AvailabilityDoc,
  AvailabilityPayload
} from '../api/types';
import { calendarEventSchema, type CalendarEventFormValues } from '../schemas/calendar';
import {
  eventTypeOptions,
  eventTypeLabels,
  eventStatusLabels,
  eventTypeColors,
  dayOfWeekLabels,
  dayOfWeekOptions
} from '../constants/options';

// ─── Helpers ──────────────────────────────────────────────────

const WEEKDAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

function isFuture(dateStr: string): boolean {
  return new Date(dateStr) > new Date();
}

/** Get all days to display in the month grid (includes padding from prev/next month) */
function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const days: Date[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

const dotColors: Record<string, string> = {
  interview: 'bg-blue-500',
  meeting: 'bg-purple-500',
  reminder: 'bg-amber-500',
  other: 'bg-gray-400'
};

// ─── Event Card ──────────────────────────────────────────────

function EventCard({
  event,
  onEdit,
  onDelete,
  deleting
}: Readonly<{
  event: CalendarEventDoc;
  onEdit: (event: CalendarEventDoc) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}>) {
  const colorClass = eventTypeColors[event.type] || eventTypeColors.other;

  return (
    <div className='group hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors'>
      <div className='flex shrink-0 flex-col items-center pt-0.5'>
        <span className='text-sm font-semibold'>{formatTime(event.startTime)}</span>
        <span className='text-muted-foreground text-xs'>–</span>
        <span className='text-muted-foreground text-xs'>{formatTime(event.endTime)}</span>
      </div>
      <div className='min-w-0 flex-1 space-y-1'>
        <div className='flex items-start justify-between gap-2'>
          <h4 className='text-sm font-medium leading-tight'>{event.title}</h4>
          <div className='flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
            <Button variant='ghost' size='sm' onClick={() => onEdit(event)}>
              <Icons.edit className='h-3.5 w-3.5' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onDelete(event.$id)}
              disabled={deleting}
            >
              <Icons.trash className='h-3.5 w-3.5' />
            </Button>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <span
            className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', colorClass)}
          >
            {eventTypeLabels[event.type]}
          </span>
          {event.status !== 'scheduled' && (
            <Badge variant='outline' className='text-xs'>
              {eventStatusLabels[event.status]}
            </Badge>
          )}
        </div>
        {event.description && (
          <p className='text-muted-foreground line-clamp-2 text-xs'>{event.description}</p>
        )}
        <div className='flex flex-wrap gap-3 pt-0.5'>
          {event.location && (
            <span className='text-muted-foreground inline-flex items-center gap-1 text-xs'>
              <Icons.mapPin className='h-3 w-3' />
              {event.location}
            </span>
          )}
          {event.meetingUrl && (
            <a
              href={event.meetingUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary inline-flex items-center gap-1 text-xs hover:underline'
            >
              <Icons.video className='h-3 w-3' />
              Videomöte
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Event Form Dialog ────────────────────────────────────────

function EventFormDialog({
  open,
  onOpenChange,
  editEvent
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEvent: CalendarEventDoc | null;
}>) {
  const isEdit = !!editEvent;

  const createMut = useMutation({
    ...createEventMutation,
    onSuccess: () => {
      toast.success('Händelse skapad!');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte skapa händelse.');
    }
  });

  const updateMut = useMutation({
    ...updateEventMutation,
    onSuccess: () => {
      toast.success('Händelse uppdaterad!');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte uppdatera händelse.');
    }
  });

  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setMinutes(0, 0, 0);
  defaultStart.setHours(defaultStart.getHours() + 1);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 1);

  const toLocalDatetime = (d: Date) => {
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  const form = useAppForm({
    defaultValues: {
      title: editEvent?.title ?? '',
      description: editEvent?.description ?? '',
      startTime: editEvent?.startTime
        ? toLocalDatetime(new Date(editEvent.startTime))
        : toLocalDatetime(defaultStart),
      endTime: editEvent?.endTime
        ? toLocalDatetime(new Date(editEvent.endTime))
        : toLocalDatetime(defaultEnd),
      type: editEvent?.type ?? 'meeting',
      location: editEvent?.location ?? '',
      meetingUrl: editEvent?.meetingUrl ?? ''
    } as CalendarEventFormValues,
    validators: {
      onSubmit: calendarEventSchema
    },
    onSubmit: ({ value }) => {
      const payload: CalendarEventPayload = {
        ...value,
        startTime: new Date(value.startTime).toISOString(),
        endTime: new Date(value.endTime).toISOString()
      };
      if (isEdit) {
        updateMut.mutate({ id: editEvent.$id, data: payload });
      } else {
        createMut.mutate(payload);
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<CalendarEventFormValues>();

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Redigera händelse' : 'Ny händelse'}</DialogTitle>
        </DialogHeader>
        <form.AppForm>
          <form.Form className='space-y-4'>
            <FormTextField
              name='title'
              label='Titel'
              required
              placeholder='T.ex. Intervju med TechBolag AB'
              validators={{
                onBlur: z.string().min(2, 'Titel måste vara minst 2 tecken.')
              }}
            />
            <FormSelectField
              name='type'
              label='Typ'
              required
              options={eventTypeOptions}
              placeholder='Välj typ'
            />
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <label className='text-sm font-medium'>
                  Starttid <span className='text-destructive'>*</span>
                </label>
                <form.Field name='startTime'>
                  {(field) => (
                    <input
                      type='datetime-local'
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className='border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm'
                    />
                  )}
                </form.Field>
              </div>
              <div className='space-y-1.5'>
                <label className='text-sm font-medium'>
                  Sluttid <span className='text-destructive'>*</span>
                </label>
                <form.Field name='endTime'>
                  {(field) => (
                    <input
                      type='datetime-local'
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className='border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm'
                    />
                  )}
                </form.Field>
              </div>
            </div>
            <FormTextareaField
              name='description'
              label='Beskrivning'
              placeholder='Valfri beskrivning...'
              rows={3}
            />
            <FormTextField
              name='location'
              label='Plats'
              placeholder='T.ex. Kontoret, Storgatan 1'
            />
            <FormTextField
              name='meetingUrl'
              label='Möteslänk'
              placeholder='https://meet.google.com/...'
            />
            <div className='flex justify-end gap-3 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Avbryt
              </Button>
              <Button type='submit' disabled={isPending} isLoading={isPending}>
                {isEdit ? 'Spara' : 'Skapa'}
              </Button>
            </div>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}

// ─── Day Detail Dialog ────────────────────────────────────────

function DayDetailDialog({
  open,
  onOpenChange,
  date,
  events,
  onEdit,
  onDelete,
  deleting
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  events: CalendarEventDoc[];
  onEdit: (event: CalendarEventDoc) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}>) {
  if (!date) return null;

  const label = date.toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='capitalize'>{label}</DialogTitle>
        </DialogHeader>
        {events.length > 0 ? (
          <div className='max-h-[60vh] space-y-3 overflow-y-auto'>
            {events
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .map((event) => (
                <EventCard
                  key={event.$id}
                  event={event}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  deleting={deleting}
                />
              ))}
          </div>
        ) : (
          <p className='text-muted-foreground py-6 text-center text-sm'>
            Inga händelser denna dag.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Availability Manager ─────────────────────────────────────

function AvailabilityManager({
  slots
}: Readonly<{
  slots: AvailabilityDoc[];
}>) {
  const [localSlots, setLocalSlots] = useState<AvailabilityPayload[]>(
    slots.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      isRecurring: s.isRecurring
    }))
  );
  const [expanded, setExpanded] = useState(false);

  const saveMut = useMutation({
    ...setAvailabilityMutation,
    onSuccess: () => {
      toast.success('Tillgänglighet sparad!');
      setExpanded(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte spara tillgänglighet.');
    }
  });

  const addSlot = () => {
    setLocalSlots((prev) => [
      ...prev,
      { dayOfWeek: 'monday', startTime: '09:00', endTime: '17:00', isRecurring: true }
    ]);
  };

  const removeSlot = (index: number) => {
    setLocalSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof AvailabilityPayload, value: string | boolean) => {
    setLocalSlots((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Icons.clock className='h-4 w-4' />
            <CardTitle className='text-sm font-semibold'>Tillgänglighet</CardTitle>
          </div>
          <Button variant='ghost' size='sm' onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Dölj' : 'Redigera'}
          </Button>
        </div>
        <CardDescription className='text-xs'>
          Ange när du är tillgänglig för intervjuer och möten.
        </CardDescription>
      </CardHeader>

      {!expanded && localSlots.length > 0 && (
        <CardContent>
          <div className='space-y-1.5'>
            {localSlots.map((slot, i) => (
              <div key={i} className='text-muted-foreground flex items-center gap-2 text-sm'>
                <Badge variant='secondary' className='text-xs'>
                  {dayOfWeekLabels[slot.dayOfWeek]}
                </Badge>
                <span>
                  {slot.startTime} – {slot.endTime}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {!expanded && localSlots.length === 0 && (
        <CardContent>
          <p className='text-muted-foreground text-sm'>Ingen tillgänglighet angiven.</p>
        </CardContent>
      )}

      {expanded && (
        <CardContent className='space-y-3'>
          {localSlots.map((slot, index) => (
            <div key={index} className='flex flex-wrap items-end gap-2 rounded-lg border p-3'>
              <div className='space-y-1'>
                <label className='text-xs font-medium'>Dag</label>
                <select
                  value={slot.dayOfWeek}
                  onChange={(e) => updateSlot(index, 'dayOfWeek', e.target.value)}
                  className='border-input bg-background flex h-9 rounded-md border px-2 text-sm'
                >
                  {dayOfWeekOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-medium'>Från</label>
                <input
                  type='time'
                  value={slot.startTime}
                  onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                  className='border-input bg-background flex h-9 rounded-md border px-2 text-sm'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-medium'>Till</label>
                <input
                  type='time'
                  value={slot.endTime}
                  onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                  className='border-input bg-background flex h-9 rounded-md border px-2 text-sm'
                />
              </div>
              <Button type='button' variant='ghost' size='sm' onClick={() => removeSlot(index)}>
                <Icons.trash className='h-3.5 w-3.5' />
              </Button>
            </div>
          ))}
          <Button type='button' variant='outline' size='sm' onClick={addSlot} className='w-full'>
            <Icons.add className='mr-2 h-4 w-4' />
            Lägg till tid
          </Button>
          <div className='flex justify-end gap-2 pt-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setExpanded(false)}
              disabled={saveMut.isPending}
            >
              Avbryt
            </Button>
            <Button
              size='sm'
              onClick={() => saveMut.mutate(localSlots)}
              disabled={saveMut.isPending}
              isLoading={saveMut.isPending}
            >
              Spara
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main Calendar View (Month Grid) ──────────────────────────

interface CalendarViewProps {
  events: CalendarEventDoc[];
  availability: AvailabilityDoc[];
}

export default function CalendarView({ events, availability }: Readonly<CalendarViewProps>) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEventDoc | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const deleteMut = useMutation({
    ...deleteEventMutation,
    onSuccess: () => {
      toast.success('Händelse borttagen.');
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte ta bort händelse.');
    }
  });

  const monthDays = useMemo(() => getMonthGrid(year, month), [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventDoc[]>();
    for (const event of events) {
      const d = new Date(event.startTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existing = map.get(key) ?? [];
      existing.push(event);
      map.set(key, existing);
    }
    return map;
  }, [events]);

  const dateKey = useCallback(
    (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    []
  );

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleEdit = (event: CalendarEventDoc) => {
    setEditEvent(event);
    setDialogOpen(true);
    setDayDialogOpen(false);
  };

  const handleAdd = () => {
    setEditEvent(null);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditEvent(null);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setDayDialogOpen(true);
  };

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate.get(dateKey(selectedDate)) ?? [];
  }, [selectedDate, eventsByDate, dateKey]);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => isFuture(e.startTime) && e.status === 'scheduled')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5),
    [events]
  );

  const monthLabel = currentDate.toLocaleDateString('sv-SE', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className='grid grid-cols-1 items-start gap-6 xl:grid-cols-4'>
      {/* ── Month Calendar Grid ── */}
      <div className='space-y-4 xl:col-span-3'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={handlePrevMonth}>
              <Icons.chevronLeft className='h-4 w-4' />
            </Button>
            <Button variant='outline' size='sm' onClick={handleToday}>
              Idag
            </Button>
            <Button variant='outline' size='sm' onClick={handleNextMonth}>
              <Icons.chevronRight className='h-4 w-4' />
            </Button>
            <h2 className='ml-2 text-lg font-semibold capitalize'>{monthLabel}</h2>
          </div>
          <Button size='sm' onClick={handleAdd}>
            <Icons.calendarPlus className='mr-2 h-4 w-4' />
            Ny händelse
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className='overflow-hidden rounded-lg border'>
          {/* Weekday headers */}
          <div className='bg-muted/50 grid grid-cols-7 border-b'>
            {WEEKDAY_LABELS.map((day) => (
              <div
                key={day}
                className='px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider'
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className='grid grid-cols-7'>
            {monthDays.map((day, idx) => {
              const key = dateKey(day);
              const dayEvents = eventsByDate.get(key) ?? [];
              const isCurrentMonth = day.getMonth() === month;
              const today = isToday(day);

              return (
                <button
                  key={idx}
                  type='button'
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'relative flex min-h-[5.5rem] flex-col items-start border-b border-r p-1.5 text-left transition-colors hover:bg-accent/50',
                    !isCurrentMonth && 'bg-muted/30 text-muted-foreground/50',
                    today && 'bg-primary/5'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm',
                      today && 'bg-primary text-primary-foreground font-bold',
                      !today && isCurrentMonth && 'font-medium'
                    )}
                  >
                    {day.getDate()}
                  </span>

                  {dayEvents.length > 0 && (
                    <div className='mt-1 flex w-full flex-col gap-0.5'>
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.$id}
                          className={cn(
                            'truncate rounded px-1 py-0.5 text-[10px] leading-tight font-medium',
                            eventTypeColors[event.type] || eventTypeColors.other
                          )}
                          title={`${formatTime(event.startTime)} ${event.title}`}
                        >
                          {formatTime(event.startTime)} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className='text-muted-foreground px-1 text-[10px]'>
                          +{dayEvents.length - 3} till
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className='flex flex-wrap items-center gap-4 px-1'>
          {eventTypeOptions.map((opt) => (
            <div key={opt.value} className='flex items-center gap-1.5'>
              <span
                className={cn('h-2.5 w-2.5 rounded-full', dotColors[opt.value] || 'bg-gray-400')}
              />
              <span className='text-muted-foreground text-xs'>{opt.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div className='space-y-6 xl:sticky xl:top-20'>
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Icons.calendarEvent className='h-4 w-4' />
              <CardTitle className='text-sm font-semibold'>Kommande händelser</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className='space-y-3'>
                {upcomingEvents.map((event) => (
                  <div key={event.$id} className='flex items-start gap-2'>
                    <div
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        dotColors[event.type] || 'bg-gray-400'
                      )}
                    />
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>{event.title}</p>
                      <p className='text-muted-foreground text-xs'>
                        {formatDate(event.startTime)} kl {formatTime(event.startTime)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>Inga kommande händelser.</p>
            )}
          </CardContent>
        </Card>

        <AvailabilityManager slots={availability} />
      </div>

      {/* Dialogs */}
      <EventFormDialog open={dialogOpen} onOpenChange={handleDialogChange} editEvent={editEvent} />
      <DayDetailDialog
        open={dayDialogOpen}
        onOpenChange={setDayDialogOpen}
        date={selectedDate}
        events={selectedDayEvents}
        onEdit={handleEdit}
        onDelete={(id) => deleteMut.mutate(id)}
        deleting={deleteMut.isPending}
      />
    </div>
  );
}
