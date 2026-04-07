import PageContainer from '@/components/layout/page-container';
import SettingsPage from '@/features/settings/components/settings-page';

export const metadata = {
  title: 'Dashboard : Inställningar'
};

export default function Page() {
  return (
    <PageContainer
      scrollable
      pageTitle='Inställningar'
      pageDescription='Hantera din e-post, lösenord och konto.'
    >
      <div className='w-full max-w-xl md:max-w-3xl'>
        <SettingsPage />
      </div>
    </PageContainer>
  );
}
