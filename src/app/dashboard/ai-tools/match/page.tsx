import PageContainer from '@/components/layout/page-container';
import { AIProvider } from '@/features/ai/components/ai-provider';
import { MatchTool } from '@/features/ai/components/match-tool';

export const metadata = {
  title: 'Dashboard : AI-matchning'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='AI-matchning'
      pageDescription='Se hur väl du matchar en praktikplats.'
    >
      <AIProvider>
        <MatchTool />
      </AIProvider>
    </PageContainer>
  );
}
