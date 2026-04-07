import PageContainer from '@/components/layout/page-container';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { internshipsQueryOptions } from '@/features/internships/api/queries';
import { CompanyDetailView } from '@/features/internships/components/company-detail-view';
import { Suspense } from 'react';

export const metadata = {
  title: 'Företag | Prakto'
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CompanyDetailPage(props: PageProps) {
  const { id } = await props.params;

  const queryClient = getQueryClient();

  // Prefetch the company's published internships
  void queryClient.prefetchQuery(
    internshipsQueryOptions({ companyId: id, status: 'published', limit: 20 })
  );

  return (
    <PageContainer scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={
            <div className='flex flex-1 animate-pulse flex-col gap-4'>
              <div className='bg-muted h-40 w-full rounded-lg' />
              <div className='bg-muted h-8 w-64 rounded' />
              <div className='bg-muted h-4 w-96 rounded' />
            </div>
          }
        >
          <CompanyDetailView companyId={id} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
