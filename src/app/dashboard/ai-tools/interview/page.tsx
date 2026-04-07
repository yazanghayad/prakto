import PageContainer from '@/components/layout/page-container';
import { AIProvider } from '@/features/ai/components/ai-provider';
import { InterviewPrepTool } from '@/features/ai/components/interview-prep-tool';

export const metadata = {
  title: 'Dashboard : Intervjuförberedelse'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Intervjuförberedelse'
      pageDescription='Generera intervjufrågor med tips och exempelsvar.'
    >
      <AIProvider>
        <InterviewPrepTool />
      </AIProvider>
    </PageContainer>
  );
}
