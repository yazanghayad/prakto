'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { studentProfileOptions } from '../api/queries';
import StudentProfileForm from './student-profile-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentProfileWrapper() {
  const { profile, user, isLoading: authLoading } = useUser();
  const userId = profile?.userId ?? '';

  const { data: studentProfile, isLoading } = useQuery({
    ...studentProfileOptions(userId),
    enabled: !!userId
  });

  if (authLoading || isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-96 w-full' />
      </div>
    );
  }

  return (
    <StudentProfileForm
      initialData={studentProfile ?? null}
      userId={userId}
      userName={profile?.displayName ?? user?.name ?? ''}
      userEmail={profile?.email ?? user?.email ?? ''}
    />
  );
}
