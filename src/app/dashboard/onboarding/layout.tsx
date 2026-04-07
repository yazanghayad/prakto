import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prakto | Registrering',
  description: 'Skapa din studentprofil på Prakto'
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
