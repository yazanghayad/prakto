import PageContainer from '@/components/layout/page-container';
import CompanyDiscoverListing from '@/features/internships/components/company-discover-listing';
import { CompanyDiscoverSkeleton } from '@/features/internships/components/company-discover-grid';
import { Suspense } from 'react';

export const metadata = {
  title: 'Praktikplatser | Prakto'
};

export default function InternshipsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Hitta företag'
      pageDescription='Utforska företag, bevaka dem och få notiser när de lägger upp nya praktikplatser.'
    >
      <Suspense fallback={<CompanyDiscoverSkeleton />}>
        <CompanyDiscoverListing />
      </Suspense>
    </PageContainer>
  );
}
