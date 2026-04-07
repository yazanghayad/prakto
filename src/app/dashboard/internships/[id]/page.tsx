import PageContainer from '@/components/layout/page-container';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { internshipByIdOptions } from '@/features/internships/api/queries';
import { StudentInternshipView } from '@/features/internships/components/student-internship-view';
import { Suspense } from 'react';

export const metadata = {
  title: 'Praktikplats | Prakto'
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InternshipDetailPage(props: PageProps) {
  const { id } = await props.params;

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(internshipByIdOptions(id));

  return (
    <PageContainer scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={
            <div className='flex flex-1 animate-pulse flex-col gap-4'>
              <div className='bg-muted h-12 w-96 rounded' />
              <div className='bg-muted h-64 w-full rounded-lg' />
            </div>
          }
        >
          <StudentInternshipView id={id} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
