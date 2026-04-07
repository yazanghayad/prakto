import PageContainer from '@/components/layout/page-container';
import { AIProvider } from '@/features/ai/components/ai-provider';
import { SkillGapTool } from '@/features/ai/components/skill-gap-tool';

export const metadata = {
  title: 'Dashboard : Kompetensgap'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Kompetensgap-analys'
      pageDescription='Analysera skillnaden mellan dina kompetenser och praktikplatsens krav.'
    >
      <AIProvider>
        <SkillGapTool />
      </AIProvider>
    </PageContainer>
  );
}
