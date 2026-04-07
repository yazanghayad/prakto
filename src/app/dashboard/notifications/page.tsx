import PageContainer from '@/components/layout/page-container';
import NotificationsPage from '@/features/notifications/components/notifications-page';

export const metadata = {
  title: 'Notiser | Prakto'
};

export default function Page() {
  return (
    <PageContainer
      scrollable
      pageTitle='Notiser'
      pageDescription='Visa och hantera alla dina notifikationer.'
    >
      <NotificationsPage />
    </PageContainer>
  );
}
