import PageContainer from '@/components/layout/page-container';
import CompanyProfilePage from '@/features/company/components/company-profile-page';

export const metadata = {
  title: 'Registrera företag | Prakto'
};

export default function CompanyOnboardingPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Företagsprofil'
      pageDescription='Fyll i dina företagsuppgifter för att registrera ert företag på Prakto. Er profil granskas av en administratör innan ni kan publicera praktikplatser.'
    >
      <CompanyProfilePage />
    </PageContainer>
  );
}
