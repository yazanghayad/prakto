import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Prakto | Skapa konto',
  description: 'Registrera dig på Prakto.'
};

export default async function Page() {
  return <SignUpViewPage />;
}
