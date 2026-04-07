import PageContainer from '@/components/layout/page-container';
import LiaReportPage from '@/features/lia-report/components/lia-report-page';

export const metadata = {
  title: 'Veckorapport | Prakto'
};

export default function Page() {
  return (
    <PageContainer
      scrollable
      pageTitle='Veckorapport'
      pageDescription='Generera veckorapport att skicka till skola/handledare'
    >
      <div className='flex-1 space-y-4'>
        <LiaReportPage />
      </div>
    </PageContainer>
  );
}
