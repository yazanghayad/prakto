import PageContainer from '@/components/layout/page-container';
import StudentListingPage from '@/features/platform/components/student-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { StudentTableSkeleton } from '@/features/platform/components/student-tables';

export const metadata = {
  title: 'Studenter | Prakto'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function StudentsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Studenter'
      pageDescription='Översikt av studenter och deras placeringsstatus.'
    >
      <Suspense fallback={<StudentTableSkeleton />}>
        <StudentListingPage />
      </Suspense>
    </PageContainer>
  );
}
