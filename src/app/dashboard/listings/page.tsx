import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import type { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { InternshipCardListSkeleton } from '@/features/internships/components/internship-card-list';
import CompanyListingsWrapper from '@/features/company/components/company-listings-wrapper';

export const metadata = {
  title: 'Mina annonser | Prakto'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CompanyListingsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Mina annonser'
      pageDescription='Hantera dina praktikplatser.'
      pageHeaderAction={
        <Link href='/dashboard/listings/new' className={cn(buttonVariants(), 'text-xs md:text-sm')}>
          <Icons.add className='mr-2 h-4 w-4' /> Skapa ny
        </Link>
      }
    >
      <Suspense fallback={<InternshipCardListSkeleton />}>
        <CompanyListingsWrapper />
      </Suspense>
    </PageContainer>
  );
}
