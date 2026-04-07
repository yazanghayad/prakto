import PageContainer from '@/components/layout/page-container';
import CVGenerator from '@/features/resources/components/cv-generator';

export const metadata = {
  title: 'CV-generator | Prakto'
};

export default function CVGeneratorPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='CV-generator'
      pageDescription='Fyll i dina uppgifter och skapa ett professionellt CV.'
    >
      <div className='flex-1 space-y-4'>
        <CVGenerator />
      </div>
    </PageContainer>
  );
}
