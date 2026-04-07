import PageContainer from '@/components/layout/page-container';
import { AIProvider } from '@/features/ai/components/ai-provider';
import { ProfileTipsTool } from '@/features/ai/components/profile-tips-tool';

export const metadata = {
  title: 'Dashboard : Profiltips'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Profiltips'
      pageDescription='Få AI-drivna tips för att förbättra din profil.'
    >
      <AIProvider>
        <ProfileTipsTool />
      </AIProvider>
    </PageContainer>
  );
}
