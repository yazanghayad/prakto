import PageContainer from '@/components/layout/page-container';
import LetterGenerator from '@/features/resources/components/letter-generator';

export const metadata = {
  title: 'Personligt brev | Prakto'
};

export default function LetterGeneratorPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Personligt brev-generator'
      pageDescription='Skapa ett övertygande personligt brev anpassat för praktikplatsen du söker.'
    >
      <div className='flex-1 space-y-4'>
        <LetterGenerator />
      </div>
    </PageContainer>
  );
}
