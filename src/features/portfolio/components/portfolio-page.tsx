'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { portfolioListOptions } from '../api/queries';
import PortfolioListing from './portfolio-listing';
import { Icons } from '@/components/icons';

export default function PortfolioPage() {
  const { profile, isLoading } = useUser();
  const userId = profile?.userId ?? '';

  const { data: items } = useSuspenseQuery(portfolioListOptions(userId));

  if (isLoading) {
    return (
      <div className='flex h-[50vh] items-center justify-center'>
        <Icons.spinner className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return <PortfolioListing items={items} />;
}
