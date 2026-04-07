import PageContainer from '@/components/layout/page-container';
import ApplicationListingPage from '@/features/internships/components/application-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { ApplicationTableSkeleton } from '@/features/internships/components/application-tables';

export const metadata = {
  title: 'Ansökningar | Prakto'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ApplicationsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Mina ansökningar'
      pageDescription='Följ statusen på dina praktikansökningar.'
    >
      <Suspense fallback={<ApplicationTableSkeleton />}>
        <ApplicationListingPage />
      </Suspense>
    </PageContainer>
  );
}
