import PageContainer from '@/components/layout/page-container';
import LiaFeedbackPage from '@/features/lia-feedback/components/lia-feedback-page';

export const metadata = {
  title: 'Feedback-logg | Prakto'
};

export default function Page() {
  return (
    <PageContainer
      scrollable
      pageTitle='Feedback-logg'
      pageDescription='Samla och spåra feedback du fått'
    >
      <div className='flex-1 space-y-4'>
        <LiaFeedbackPage />
      </div>
    </PageContainer>
  );
}
