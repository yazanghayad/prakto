import PageContainer from '@/components/layout/page-container';
import LiaJournalPage from '@/features/lia-journal/components/lia-journal-page';

export const metadata = {
  title: 'Praktik-dagbok | Prakto'
};

export default function Page() {
  return (
    <PageContainer
      scrollable
      pageTitle='Praktik-dagbok'
      pageDescription='Dokumentera din praktik vecka för vecka'
    >
      <div className='flex-1 space-y-4'>
        <LiaJournalPage />
      </div>
    </PageContainer>
  );
}
