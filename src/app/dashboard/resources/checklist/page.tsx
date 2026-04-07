import PageContainer from '@/components/layout/page-container';
import PracticeChecklist from '@/features/resources/components/practice-checklist';

export const metadata = {
  title: 'Praktik-checklista | Prakto'
};

export default function ChecklistPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Checklista för praktiken'
      pageDescription='Håll koll på allt du behöver göra — före, under och efter praktiken.'
    >
      <div className='flex-1 space-y-4'>
        <PracticeChecklist />
      </div>
    </PageContainer>
  );
}
