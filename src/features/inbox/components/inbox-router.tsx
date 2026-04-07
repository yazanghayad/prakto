'use client';

import { useUser } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import CompanyInbox from './company-inbox-v2';
import StudentInbox from './student-inbox';

export default function InboxRouter() {
  const { role, isLoading } = useUser();

  if (isLoading || role === null) {
    return (
      <div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
        <Skeleton className='h-8 w-32' />
      </div>
    );
  }

  if (role === 'student') {
    return <StudentInbox />;
  }

  return <CompanyInbox />;
}
