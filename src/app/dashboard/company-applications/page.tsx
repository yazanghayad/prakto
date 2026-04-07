import PageContainer from '@/components/layout/page-container';
import CompanyApplicationsWrapper from '@/features/company/components/company-applications-wrapper';
import { Suspense } from 'react';
import { ApplicationCardListSkeleton } from '@/features/internships/components/application-card-list';

export const metadata = {
  title: 'Inkomna ansökningar | Prakto'
};

export default async function CompanyApplicationsPage() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Inkomna ansökningar'
      pageDescription='Granska och hantera ansökningar till dina praktikplatser.'
    >
      <Suspense fallback={<ApplicationCardListSkeleton />}>
        <CompanyApplicationsWrapper />
      </Suspense>
    </PageContainer>
  );
}
