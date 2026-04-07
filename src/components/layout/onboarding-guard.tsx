'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { studentProfileOptions } from '@/features/profile/api/queries';

/**
 * Client-side onboarding redirect.
 * Renders nothing visible — just redirects students without a profile
 * to /dashboard/onboarding.
 */
export function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isLoading: authLoading } = useUser();
  const userId = profile?.userId ?? '';
  const isStudent = profile?.role === 'student';
  const isOnboardingPage = pathname.startsWith('/dashboard/onboarding');

  const { data: studentProfile, isLoading: studentLoading } = useQuery({
    ...studentProfileOptions(userId),
    enabled: !!userId && isStudent
  });

  useEffect(() => {
    if (isOnboardingPage) return;
    if (authLoading || studentLoading) return;
    if (!isStudent) return;
    if (!studentProfile) {
      router.replace('/dashboard/onboarding');
    }
  }, [authLoading, studentLoading, isStudent, studentProfile, isOnboardingPage, router]);

  return null;
}
