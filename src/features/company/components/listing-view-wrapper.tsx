'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { companyProfileOptions } from '@/features/company/api/queries';
import InternshipViewPage from '@/features/internships/components/internship-view-page';
import { Skeleton } from '@/components/ui/skeleton';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Icons } from '@/components/icons';

const BuildingIcon = Icons.building;

interface ListingViewWrapperProps {
  internshipId: string;
}

export default function ListingViewWrapper({ internshipId }: Readonly<ListingViewWrapperProps>) {
  const { profile } = useUser();
  const userId = profile?.userId ?? '';

  const { data: company, isLoading } = useQuery(companyProfileOptions(userId));

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-96 w-full' />
      </div>
    );
  }

  if (!company) {
    return (
      <Card className='mx-auto max-w-lg'>
        <CardHeader>
          <CardTitle>Företagsprofil saknas</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground text-sm'>
            Du behöver registrera ditt företag innan du kan skapa praktikplatser.
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
    <InternshipViewPage internshipId={internshipId} companyId={company.$id} company={company} />
  );
}
