import PageContainer from '@/components/layout/page-container';
import InternshipListingPage from '@/features/internships/components/internship-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { InternshipTableSkeleton } from '@/features/internships/components/internship-tables';

export const metadata = {
  title: 'Alla annonser | Prakto Admin'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AdminInternshipsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Alla annonser'
      pageDescription='Granska och moderera alla praktikplatsannonser.'
    >
      <Suspense fallback={<InternshipTableSkeleton />}>
        {/* Admin sees all statuses */}
        <InternshipListingPage statusFilter={undefined} />
      </Suspense>
    </PageContainer>
  );
}
