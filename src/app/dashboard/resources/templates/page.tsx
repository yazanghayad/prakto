import PageContainer from '@/components/layout/page-container';
import TemplateLibrary from '@/features/resources/components/template-library';

export const metadata = {
  title: 'Mallbibliotek | Prakto'
};

export default function TemplatesPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Mallbibliotek'
      pageDescription='Färdiga mallar för CV, personligt brev, tackbrev och mer.'
    >
      <div className='flex-1 space-y-4'>
        <TemplateLibrary />
      </div>
    </PageContainer>
  );
}
