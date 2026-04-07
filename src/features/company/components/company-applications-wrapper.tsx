'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { companyProfileOptions } from '@/features/company/api/queries';
import {
  ApplicationCardList,
  ApplicationCardListSkeleton
} from '@/features/internships/components/application-card-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Icons } from '@/components/icons';

export default function CompanyApplicationsWrapper() {
  const { profile } = useUser();
  const userId = profile?.userId ?? '';

  const { data: company, isLoading } = useQuery(companyProfileOptions(userId));

  if (isLoading) {
    return <ApplicationCardListSkeleton />;
  }

  if (!company) {
    const BuildingIcon = Icons.building;
    return (
      <Card className='mx-auto max-w-lg'>
        <CardHeader>
          <CardTitle>Företagsprofil saknas</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground text-sm'>
            Du behöver registrera ditt företag innan du kan se ansökningar.
          </p>
          <Button asChild>
            <Link href='/dashboard/company/onboarding'>
              <BuildingIcon className='mr-2 h-4 w-4' />
              Registrera företag
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Suspense fallback={<ApplicationCardListSkeleton />}>
      <ApplicationCardList companyId={company.$id} />
    </Suspense>
  );
}
