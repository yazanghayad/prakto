import PageContainer from '@/components/layout/page-container';
import LiaTimePage from '@/features/lia-time/components/lia-time-page';

export const metadata = {
  title: 'Tidrapport | Prakto'
};

export default function Page() {
  return (
    <PageContainer scrollable pageTitle='Tidrapport' pageDescription='Logga arbetstimmar per dag'>
      <div className='flex-1 space-y-4'>
        <LiaTimePage />
      </div>
    </PageContainer>
  );
}
