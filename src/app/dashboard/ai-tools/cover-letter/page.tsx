import PageContainer from '@/components/layout/page-container';
import { AIProvider } from '@/features/ai/components/ai-provider';
import { CoverLetterTool } from '@/features/ai/components/cover-letter-tool';

export const metadata = {
  title: 'Dashboard : Personligt brev'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Personligt brev'
      pageDescription='Generera ett skräddarsytt personligt brev.'
    >
      <AIProvider>
        <CoverLetterTool />
      </AIProvider>
    </PageContainer>
  );
}
