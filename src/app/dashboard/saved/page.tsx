import PageContainer from '@/components/layout/page-container';
import SavedInternshipsListing from '@/features/bookmarks/components/saved-internships-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Sparade praktikplatser | Prakto'
};

export default function SavedPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Sparade praktikplatser'
      pageDescription='Praktikplatser du har sparat för att läsa senare eller ansöka till.'
    >
      <div className='flex-1 space-y-4'>
        <Suspense
          fallback={
            <div className='flex flex-1 animate-pulse flex-col gap-3'>
              <div className='bg-muted h-10 w-48 rounded' />
              <div className='bg-muted h-32 w-full rounded-lg' />
              <div className='bg-muted h-32 w-full rounded-lg' />
              <div className='bg-muted h-32 w-full rounded-lg' />
            </div>
          }
        >
          <SavedInternshipsListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}
