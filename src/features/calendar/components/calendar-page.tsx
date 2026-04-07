'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { calendarEventsOptions, availabilityOptions } from '../api/queries';
import CalendarView from './calendar-view';
import { Icons } from '@/components/icons';

export default function CalendarPage() {
  const { profile, isLoading } = useUser();
  const userId = profile?.userId ?? '';

  const { data: events } = useSuspenseQuery(calendarEventsOptions(userId));
  const { data: availability } = useSuspenseQuery(availabilityOptions(userId));

  if (isLoading) {
    return (
      <div className='flex h-[50vh] items-center justify-center'>
        <Icons.spinner className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return <CalendarView events={events} availability={availability} />;
}
