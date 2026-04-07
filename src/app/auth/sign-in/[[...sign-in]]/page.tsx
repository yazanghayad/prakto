import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Prakto | Logga in',
  description: 'Logga in på Prakto.'
};

export default async function Page() {
  return <SignInViewPage />;
}
