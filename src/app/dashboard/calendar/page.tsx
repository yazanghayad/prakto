import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import PageContainer from '@/components/layout/page-container';
import CalendarPage from '@/features/calendar/components/calendar-page';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Dashboard : Kalender'
};

function CalendarSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
      <div className='space-y-4 lg:col-span-2'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-9 w-64' />
          <Skeleton className='h-9 w-32' />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-20 w-full rounded-lg' />
        ))}
      </div>
      <div className='space-y-4'>
        <Skeleton className='h-40 w-full rounded-lg' />
        <Skeleton className='h-40 w-full rounded-lg' />
      </div>
    </div>
  );
}

export default function Page() {
  const queryClient = getQueryClient();

  return (
    <PageContainer
      pageTitle='Kalender'
      pageDescription='Hantera intervjuer, möten och din tillgänglighet.'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarPage />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
