import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Dashboard : AI-verktyg'
};

export default function Page() {
  redirect('/dashboard/ai-tools/match');
}
