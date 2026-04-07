import PageContainer from '@/components/layout/page-container';
import InterviewPrep from '@/features/resources/components/interview-prep';

export const metadata = {
  title: 'Intervjuförberedelse | Prakto'
};

export default function InterviewPrepPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Intervjuförberedelse'
      pageDescription='Vanliga frågor, exempelsvar och STAR-metoden.'
    >
      <div className='flex-1 space-y-4'>
        <InterviewPrep />
      </div>
    </PageContainer>
  );
}
