import { redirect } from 'next/navigation';

export default async function Page() {
  // Middleware handles auth redirect — if user reaches here, send to dashboard
  redirect('/dashboard');
}
