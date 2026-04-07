import PageContainer from '@/components/layout/page-container';
import CompanyListingPage from '@/features/platform/components/company-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { CompanyTableSkeleton } from '@/features/platform/components/company-tables';

export const metadata = {
  title: 'Företag | Prakto Admin'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CompaniesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Företag'
      pageDescription='Granska och godkänn registrerade företag.'
    >
      <Suspense fallback={<CompanyTableSkeleton />}>
        <CompanyListingPage />
      </Suspense>
    </PageContainer>
  );
}
