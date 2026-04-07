import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import PageContainer from '@/components/layout/page-container';
import PortfolioPage from '@/features/portfolio/components/portfolio-page';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Dashboard : Portfolio'
};

function PortfolioSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='h-9 w-28' />
      </div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className='h-48 w-full rounded-lg' />
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const queryClient = getQueryClient();

  return (
    <PageContainer
      pageTitle='Portfolio'
      pageDescription='Visa dina projektarbeten, GitHub-länkar och designportfolios för företag.'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<PortfolioSkeleton />}>
          <PortfolioPage />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
