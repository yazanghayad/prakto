'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { companyProfileOptions } from '@/features/company/api/queries';
import {
  InternshipCardList,
  InternshipCardListSkeleton
} from '@/features/internships/components/internship-card-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Icons } from '@/components/icons';

export default function CompanyListingsWrapper() {
  const { profile } = useUser();
  const userId = profile?.userId ?? '';

  const { data: company, isLoading } = useQuery(companyProfileOptions(userId));

  if (isLoading) {
    return <InternshipCardListSkeleton />;
  }

  if (!company) {
    return (
      <Card className='mx-auto max-w-lg'>
        <CardHeader>
          <CardTitle>Företagsprofil saknas</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground text-sm'>
            Du behöver registrera ditt företag innan du kan hantera praktikplatser.
          </p>
          <Button asChild>
            <Link href='/dashboard/company/onboarding'>
              <Icons.building className='mr-2 h-4 w-4' />
              Registrera företag
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Suspense fallback={<InternshipCardListSkeleton />}>
      <InternshipCardList companyId={company.$id} />
    </Suspense>
  );
}
