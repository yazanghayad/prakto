import PageContainer from '@/components/layout/page-container';
import ListingViewWrapper from '@/features/company/components/listing-view-wrapper';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { internshipByIdOptions } from '@/features/internships/api/queries';
import { Suspense } from 'react';

export const metadata = {
  title: 'Praktikplats | Prakto'
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ListingDetailPage(props: PageProps) {
  const { id } = await props.params;
  const isNew = id === 'new';

  const queryClient = getQueryClient();
  if (!isNew) {
    void queryClient.prefetchQuery(internshipByIdOptions(id));
  }

  return (
    <PageContainer
      scrollable
      pageTitle={isNew ? 'Skapa praktikplats' : undefined}
      pageDescription={
        isNew ? 'Fyll i uppgifterna nedan för att skapa en ny praktikannons.' : undefined
      }
    >
      <div className='flex-1 space-y-4'>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense
            fallback={
              <div className='flex flex-1 animate-pulse flex-col gap-4'>
                <div className='bg-muted h-10 w-64 rounded' />
                <div className='bg-muted h-96 w-full rounded-lg' />
              </div>
            }
          >
            <ListingViewWrapper internshipId={id} />
          </Suspense>
        </HydrationBoundary>
      </div>
    </PageContainer>
  );
}
