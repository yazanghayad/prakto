import PageContainer from '@/components/layout/page-container';
import LiaContactsPage from '@/features/lia-contacts/components/lia-contacts-page';

export const metadata = {
  title: 'Kontakter | Prakto'
};

export default function Page() {
  return (
    <PageContainer scrollable pageTitle='Kontakter' pageDescription='Personer du träffat under LIA'>
      <div className='flex-1 space-y-4'>
        <LiaContactsPage />
      </div>
    </PageContainer>
  );
}
