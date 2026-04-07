import PageContainer from '@/components/layout/page-container';
import LiaNotesPage from '@/features/lia-notes/components/lia-notes-page';

export const metadata = {
  title: 'Anteckningar | Prakto'
};

export default function Page() {
  return (
    <PageContainer
      scrollable
      pageTitle='Anteckningar'
      pageDescription='Fria anteckningar under din LIA-period'
    >
      <div className='flex-1 space-y-4'>
        <LiaNotesPage />
      </div>
    </PageContainer>
  );
}
