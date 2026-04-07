import PageContainer from '@/components/layout/page-container';
import LiaGoalsPage from '@/features/lia-goals/components/lia-goals-page';

export const metadata = {
  title: 'Mål-tracker | Prakto'
};

export default function Page() {
  return (
    <PageContainer
      scrollable
      pageTitle='Mål-tracker'
      pageDescription='Bocka av kursmål under din LIA-period'
    >
      <div className='flex-1 space-y-4'>
        <LiaGoalsPage />
      </div>
    </PageContainer>
  );
}
