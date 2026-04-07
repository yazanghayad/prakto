'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { companyProfileOptions } from '@/features/company/api/queries';
import CompanyProfileForm from '@/features/company/components/company-profile-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function CompanyProfilePage() {
  const { profile } = useUser();
  const userId = profile?.userId ?? '';

  const { data: company, isLoading } = useQuery(companyProfileOptions(userId));

  if (isLoading) {
    return (
      <div className='mx-auto max-w-2xl space-y-4'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-96 w-full' />
      </div>
    );
  }

  return (
    <CompanyProfileForm
      initialData={company ?? null}
      pageTitle={company ? 'Redigera företagsprofil' : 'Registrera ditt företag'}
    />
  );
}
