import PageContainer from '@/components/layout/page-container';
import LiaMeetingsPage from '@/features/lia-meetings/components/lia-meetings-page';

export const metadata = {
  title: 'Handledarmöten | Prakto'
};

export default function Page() {
  return (
    <PageContainer
      scrollable
      pageTitle='Handledarmöten'
      pageDescription='Dokumentera möten med din handledare'
    >
      <div className='flex-1 space-y-4'>
        <LiaMeetingsPage />
      </div>
    </PageContainer>
  );
}
