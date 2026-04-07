'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { studentProfileOptions } from '@/features/profile/api/queries';
import { StudentOnboardingWizard } from '@/features/profile/components/student-onboarding-wizard';

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading } = useUser();
  const userId = profile?.userId ?? '';
  const isStudent = profile?.role === 'student';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: studentProfile, isLoading: studentLoading } = useQuery({
    ...studentProfileOptions(userId),
    enabled: !!userId && isStudent
  });

  // If student profile already exists, redirect to dashboard
  useEffect(() => {
    if (!authLoading && !studentLoading && studentProfile) {
      router.replace('/dashboard/overview');
    }
  }, [authLoading, studentLoading, studentProfile, router]);

  // Non-student roles shouldn't be here
  useEffect(() => {
    if (!authLoading && profile && !isStudent) {
      router.replace('/dashboard/overview');
    }
  }, [authLoading, profile, isStudent, router]);

  if (authLoading || studentLoading) {
    if (!mounted) return null;
    return createPortal(
      <div className='bg-background fixed inset-0 z-[9999] flex items-center justify-center'>
        <Icons.spinner className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>,
      document.body
    );
  }

  // Already has profile — show nothing while redirecting
  if (studentProfile) {
    return null;
  }

  return <StudentOnboardingWizard />;
}
